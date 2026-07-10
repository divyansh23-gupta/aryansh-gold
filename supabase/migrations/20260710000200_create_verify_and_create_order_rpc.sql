-- =========================================================================
-- MILESTONE 11: VERIFY & CREATE ORDER RPC TRANSACTION
-- =========================================================================

CREATE OR REPLACE FUNCTION public.verify_and_create_order(
  p_razorpay_order_id TEXT,
  p_razorpay_payment_id TEXT,
  p_razorpay_signature TEXT
)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_draft_id UUID;
  v_user_id UUID;
  v_customer_name TEXT;
  v_customer_email TEXT;
  v_customer_phone TEXT;
  v_shipping_address JSONB;
  v_billing_address JSONB;
  v_cart_items JSONB;
  v_subtotal NUMERIC(12,2);
  v_shipping_cost NUMERIC(12,2);
  v_total_amount NUMERIC(12,2);
  v_status TEXT;
  
  v_order_id UUID;
  v_order_number TEXT;
  v_item RECORD;
  v_variant_id UUID;
  v_quantity INTEGER;
  v_stock_quantity INTEGER;
  v_reserved_quantity INTEGER;
  v_variant_status public.variant_status;
  v_price NUMERIC(12,2);
  v_product_id UUID;
  v_product_name TEXT;
  v_sku TEXT;
  
  v_has_conflict BOOLEAN := FALSE;
  v_conflict_message TEXT;
BEGIN
  -- 1. Lock the order_draft row for update
  SELECT id, user_id, customer_name, customer_email, customer_phone, shipping_address, billing_address, cart_items, subtotal, shipping_cost, total_amount, status
  INTO v_draft_id, v_user_id, v_customer_name, v_customer_email, v_customer_phone, v_shipping_address, v_billing_address, v_cart_items, v_subtotal, v_shipping_cost, v_total_amount, v_status
  FROM public.order_drafts
  WHERE razorpay_order_id = p_razorpay_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft transaction not found for order ID %', p_razorpay_order_id;
  END IF;

  -- 2. If already processed, return success immediately
  IF v_status = 'completed' THEN
    -- Fetch the order number that was created
    SELECT order_number INTO v_order_number 
    FROM public.orders 
    WHERE id = (SELECT completed_order_id FROM public.order_drafts WHERE id = v_draft_id);
    
    RETURN jsonb_build_object(
      'status', 'completed',
      'order_number', v_order_number,
      'message', 'Order already placed.'
    );
  END IF;

  IF v_status = 'inventory_conflict' THEN
    RETURN jsonb_build_object(
      'status', 'inventory_conflict',
      'message', 'Inventory conflict encountered. System flagged for admin review.'
    );
  END IF;

  -- 3. Create a temporary table to check items and lock variant rows
  CREATE TEMP TABLE temp_draft_items (
    variant_id UUID,
    product_id UUID,
    product_name_snapshot TEXT,
    sku_snapshot TEXT,
    unit_price NUMERIC(12,2),
    quantity INTEGER,
    total_price NUMERIC(12,2)
  ) ON COMMIT DROP;

  -- 4. Check stock for each item in the draft
  FOR v_item IN SELECT * FROM jsonb_to_recordset(v_cart_items) AS x(variant_id UUID, quantity INTEGER) LOOP
    v_variant_id := v_item.variant_id;
    v_quantity := v_item.quantity;

    -- Lock the product_variant row
    SELECT stock_quantity, reserved_quantity, status, price, product_id, sku
    INTO v_stock_quantity, v_reserved_quantity, v_variant_status, v_price, v_product_id, v_sku
    FROM public.product_variants
    WHERE id = v_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      v_has_conflict := TRUE;
      v_conflict_message := 'Product variant ' || v_variant_id::TEXT || ' not found.';
      EXIT;
    END IF;

    IF v_variant_status != 'active' THEN
      v_has_conflict := TRUE;
      v_conflict_message := 'Product variant ' || v_sku || ' is no longer active.';
      EXIT;
    END IF;

    -- Check available stock
    IF (v_stock_quantity - COALESCE(v_reserved_quantity, 0)) < v_quantity THEN
      SELECT name INTO v_product_name FROM public.products WHERE id = v_product_id;
      v_has_conflict := TRUE;
      v_conflict_message := 'Insufficient stock for product "' || COALESCE(v_product_name, 'Unknown') || '".';
      EXIT;
    END IF;

    -- Retrieve product name
    SELECT name INTO v_product_name FROM public.products WHERE id = v_product_id;

    INSERT INTO temp_draft_items (variant_id, product_id, product_name_snapshot, sku_snapshot, unit_price, quantity, total_price)
    VALUES (v_variant_id, v_product_id, COALESCE(v_product_name, 'Unknown Product'), COALESCE(v_sku, 'SKU-UNKNOWN'), v_price, v_quantity, v_price * v_quantity);
  END LOOP;

  -- 5. Handle Inventory Conflict (Oversold scenario)
  IF v_has_conflict THEN
    UPDATE public.order_drafts
    SET status = 'inventory_conflict',
        payment_status = 'paid',
        verification_completed_at = now()
    WHERE id = v_draft_id;
    
    RETURN jsonb_build_object(
      'status', 'inventory_conflict',
      'message', v_conflict_message
    );
  END IF;

  -- 6. Insert order header into public.orders
  INSERT INTO public.orders (
    user_id,
    subtotal,
    shipping_cost,
    total_amount,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    billing_address,
    status,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    payment_status
  ) VALUES (
    v_user_id,
    v_subtotal,
    v_shipping_cost,
    v_total_amount,
    v_customer_name,
    v_customer_email,
    v_customer_phone,
    v_shipping_address,
    v_billing_address,
    'confirmed'::public.order_status,
    p_razorpay_order_id,
    p_razorpay_payment_id,
    p_razorpay_signature,
    'paid'::public.payment_status
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  -- 7. Insert order items
  INSERT INTO public.order_items (
    order_id,
    product_id,
    variant_id,
    product_name_snapshot,
    sku_snapshot,
    unit_price,
    quantity,
    total_price
  )
  SELECT
    v_order_id,
    product_id,
    variant_id,
    product_name_snapshot,
    sku_snapshot,
    unit_price,
    quantity,
    total_price
  FROM temp_draft_items;

  -- 8. Deduct stock from product_variants
  FOR v_item IN SELECT * FROM temp_draft_items LOOP
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_item.quantity,
        status = CASE WHEN (stock_quantity - v_item.quantity) <= 0 THEN 'out_of_stock'::public.variant_status ELSE status END
    WHERE id = v_item.variant_id;
  END LOOP;

  -- 9. Update order_draft
  UPDATE public.order_drafts
  SET status = 'completed',
      payment_status = 'paid',
      completed_order_id = v_order_id,
      verification_completed_at = now()
  WHERE id = v_draft_id;

  -- 10. Clear client cart
  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.cart_items WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'completed',
    'order_number', v_order_number,
    'message', 'Order placed successfully.'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.verify_and_create_order(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_and_create_order(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_and_create_order(TEXT, TEXT, TEXT) TO service_role;
