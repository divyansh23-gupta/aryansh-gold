-- =========================================================================
-- TRANSACTIONAL ORDER PLACEMENT RPC FUNCTION (WITH SECURITY HARDENING)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.place_order(
  p_user_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_shipping_address JSONB,
  p_billing_address JSONB,
  p_notes TEXT,
  p_cart_items JSONB
)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item RECORD;
  v_subtotal NUMERIC(12,2) := 0.00;
  v_shipping_cost NUMERIC(12,2) := 99.00; -- Fixed shipping rate of 99
  v_tax_amount NUMERIC(12,2) := 0.00;
  v_discount_amount NUMERIC(12,2) := 0.00;
  v_total_amount NUMERIC(12,2) := 0.00;
  v_variant_id UUID;
  v_quantity INTEGER;
  v_stock_quantity INTEGER;
  v_reserved_quantity INTEGER;
  v_status public.variant_status;
  v_price NUMERIC(12,2);
  v_product_id UUID;
  v_product_name TEXT;
  v_sku TEXT;
  v_calculated_item_total NUMERIC(12,2);
BEGIN
  -- Security Hardening: Validate that cart is not empty before calculations
  IF p_cart_items IS NULL OR jsonb_array_length(p_cart_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Create a temporary table to hold items during calculation
  CREATE TEMP TABLE temp_order_items (
    variant_id UUID,
    product_id UUID,
    product_name_snapshot TEXT,
    sku_snapshot TEXT,
    unit_price NUMERIC(12,2),
    quantity INTEGER,
    total_price NUMERIC(12,2)
  ) ON COMMIT DROP;

  -- 1. Validate & Lock stock for each cart item
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(variant_id UUID, quantity INTEGER) LOOP
    v_variant_id := v_item.variant_id;
    v_quantity := v_item.quantity;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Quantity for variant % must be greater than zero', v_variant_id;
    END IF;

    -- Row level lock using FOR UPDATE
    SELECT stock_quantity, reserved_quantity, status, price, product_id, sku
    INTO v_stock_quantity, v_reserved_quantity, v_status, v_price, v_product_id, v_sku
    FROM public.product_variants
    WHERE id = v_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant % not found', v_variant_id;
    END IF;

    IF v_status != 'active' THEN
      RAISE EXCEPTION 'Product variant % is not active', v_variant_id;
    END IF;

    -- Check available stock
    IF (v_stock_quantity - COALESCE(v_reserved_quantity, 0)) < v_quantity THEN
      -- Get product name for clear error messaging
      SELECT name INTO v_product_name FROM public.products WHERE id = v_product_id;
      RAISE EXCEPTION 'Insufficient stock for product "%" (requested %, available %)', 
        COALESCE(v_product_name, 'Unknown'), v_quantity, (v_stock_quantity - COALESCE(v_reserved_quantity, 0));
    END IF;

    -- Retrieve product name snapshot
    SELECT name INTO v_product_name FROM public.products WHERE id = v_product_id;

    -- Calculate item total price
    v_calculated_item_total := v_price * v_quantity;
    v_subtotal := v_subtotal + v_calculated_item_total;

    -- Store item detail in temporary table
    INSERT INTO temp_order_items (variant_id, product_id, product_name_snapshot, sku_snapshot, unit_price, quantity, total_price)
    VALUES (v_variant_id, v_product_id, COALESCE(v_product_name, 'Unknown Product'), COALESCE(v_sku, 'SKU-UNKNOWN'), v_price, v_quantity, v_calculated_item_total);
  END LOOP;

  -- 2. Calculate grand total
  v_total_amount := v_subtotal + v_shipping_cost + v_tax_amount - v_discount_amount;

  -- 3. Insert order header into public.orders
  INSERT INTO public.orders (
    user_id,
    subtotal,
    shipping_cost,
    tax_amount,
    discount_amount,
    total_amount,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    billing_address,
    notes,
    status
  ) VALUES (
    p_user_id,
    v_subtotal,
    v_shipping_cost,
    v_tax_amount,
    v_discount_amount,
    v_total_amount,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_shipping_address,
    p_billing_address,
    p_notes,
    'pending'::public.order_status
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  -- 4. Insert order items into public.order_items
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
  FROM temp_order_items;

  -- 5. Deduct inventory (subtract from stock_quantity, and update variant status if stock reaches 0)
  FOR v_item IN SELECT * FROM temp_order_items LOOP
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - v_item.quantity,
        status = CASE WHEN (stock_quantity - v_item.quantity) <= 0 THEN 'out_of_stock'::public.variant_status ELSE status END
    WHERE id = v_item.variant_id;
  END LOOP;

  -- 6. Clear client cart (if user_id is provided)
  IF p_user_id IS NOT NULL THEN
    DELETE FROM public.cart_items WHERE user_id = p_user_id;
  END IF;

  -- Return successfully created order details
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total_amount
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.place_order(UUID, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.place_order(UUID, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(UUID, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, JSONB) TO service_role;
