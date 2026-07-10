-- =========================================================================
-- MILESTONE 11: ADMIN FORCE CONFIRM DRAFT RPC
-- =========================================================================

CREATE OR REPLACE FUNCTION public.force_confirm_draft(
  p_draft_id UUID,
  p_admin_id UUID
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
  v_razorpay_order_id TEXT;
  
  v_order_id UUID;
  v_order_number TEXT;
  v_item RECORD;
  v_variant_id UUID;
  v_quantity INTEGER;
  v_price NUMERIC(12,2);
  v_product_id UUID;
  v_product_name TEXT;
  v_sku TEXT;
BEGIN
  -- 1. Lock the order_draft row for update
  SELECT id, user_id, customer_name, customer_email, customer_phone, shipping_address, billing_address, cart_items, subtotal, shipping_cost, total_amount, status, razorpay_order_id
  INTO v_draft_id, v_user_id, v_customer_name, v_customer_email, v_customer_phone, v_shipping_address, v_billing_address, v_cart_items, v_subtotal, v_shipping_cost, v_total_amount, v_status, v_razorpay_order_id
  FROM public.order_drafts
  WHERE id = p_draft_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft transaction not found';
  END IF;

  IF v_status = 'completed' THEN
    RAISE EXCEPTION 'This draft has already been confirmed';
  END IF;

  -- Create a temporary table to check items and lock variant rows
  CREATE TEMP TABLE temp_force_items (
    variant_id UUID,
    product_id UUID,
    product_name_snapshot TEXT,
    sku_snapshot TEXT,
    unit_price NUMERIC(12,2),
    quantity INTEGER,
    total_price NUMERIC(12,2)
  ) ON COMMIT DROP;

  -- 2. Map items and lock variant rows without stock checking
  FOR v_item IN SELECT * FROM jsonb_to_recordset(v_cart_items) AS x(variant_id UUID, quantity INTEGER) LOOP
    v_variant_id := v_item.variant_id;
    v_quantity := v_item.quantity;

    -- Fetch variant details
    SELECT price, product_id, sku
    INTO v_price, v_product_id, v_sku
    FROM public.product_variants
    WHERE id = v_variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant % not found', v_variant_id;
    END IF;

    -- Retrieve product name
    SELECT name INTO v_product_name FROM public.products WHERE id = v_product_id;

    INSERT INTO temp_force_items (variant_id, product_id, product_name_snapshot, sku_snapshot, unit_price, quantity, total_price)
    VALUES (v_variant_id, v_product_id, COALESCE(v_product_name, 'Unknown Product'), COALESCE(v_sku, 'SKU-UNKNOWN'), v_price, v_quantity, v_price * v_quantity);
  END LOOP;

  -- 3. Insert order header into public.orders
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
    v_razorpay_order_id,
    'paid'::public.payment_status
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  -- 4. Insert order items
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
  FROM temp_force_items;

  -- 5. Force deduct stock (can go negative since we are forcing it)
  FOR v_item IN SELECT * FROM temp_force_items LOOP
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_item.quantity,
        status = CASE WHEN (stock_quantity - v_item.quantity) <= 0 THEN 'out_of_stock'::public.variant_status ELSE status END
    WHERE id = v_item.variant_id;
  END LOOP;

  -- 6. Insert Order Status History log
  INSERT INTO public.order_status_history (
    order_id,
    status,
    notes,
    changed_by
  ) VALUES (
    v_order_id,
    'confirmed'::public.order_status,
    'Order forced manually by admin resolving inventory conflict',
    p_admin_id
  );

  -- 7. Update draft
  UPDATE public.order_drafts
  SET status = 'completed',
      payment_status = 'paid',
      completed_order_id = v_order_id,
      verification_completed_at = now()
  WHERE id = v_draft_id;

  RETURN jsonb_build_object(
    'status', 'completed',
    'order_number', v_order_number,
    'message', 'Draft forced successfully.'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.force_confirm_draft(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_confirm_draft(UUID, UUID) TO service_role;
