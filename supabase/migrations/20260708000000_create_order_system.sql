-- =========================================================================
-- ORDER SYSTEM DATABASE FOUNDATION
-- =========================================================================

-- 1. Create order_status enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM (
      'pending',
      'confirmed',
      'shipped',
      'delivered',
      'cancelled'
    );
  END IF;
END $$;

-- 2. Create sequence-backed order_number generator
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1000;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN 'AG-' || to_char(CURRENT_DATE, 'YYMMDD') || '-' || LPAD(nextval('public.order_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE DEFAULT public.generate_order_number(),
  status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL CONSTRAINT chk_orders_subtotal CHECK (subtotal >= 0),
  shipping_cost NUMERIC(12,2) DEFAULT 0 NOT NULL CONSTRAINT chk_orders_shipping CHECK (shipping_cost >= 0),
  tax_amount NUMERIC(12,2) DEFAULT 0 NOT NULL CONSTRAINT chk_orders_tax CHECK (tax_amount >= 0),
  discount_amount NUMERIC(12,2) DEFAULT 0 NOT NULL CONSTRAINT chk_orders_discount CHECK (discount_amount >= 0),
  total_amount NUMERIC(12,2) NOT NULL CONSTRAINT chk_orders_total CHECK (total_amount >= 0),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  sku_snapshot TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL CONSTRAINT chk_order_items_price CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  total_price NUMERIC(12,2) NOT NULL CONSTRAINT chk_order_items_total CHECK (total_price >= 0)
);

-- 5. Create order_status_history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  status public.order_status NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- 7. Triggers
-- A. Updated_at Trigger for orders
DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at 
  BEFORE UPDATE ON public.orders 
  FOR EACH ROW 
  EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

-- B. History Trigger (Inserts first history row 'pending' automatically on creation)
CREATE OR REPLACE FUNCTION public.handle_order_created_history()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.order_status_history (order_id, status, notes, changed_by)
  VALUES (new.id, new.status, 'Order created.', new.user_id);
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_created_history ON public.orders;
CREATE TRIGGER on_order_created_history
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_order_created_history();

-- 8. Performance & Search Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at DESC);

-- 9. Row Level Security Policies

-- A. Orders Policies
-- [SECURITY WARNING]: Guest checkout (where user_id is NULL) is temporarily allowed via client direct inserts.
-- Under production guidelines, direct client-side anonymous inserts will move to a secure payment callback.
DROP POLICY IF EXISTS "Enable read access for order owners" ON public.orders;
CREATE POLICY "Enable read access for order owners" ON public.orders
  FOR SELECT
  USING (
    (auth.uid() = user_id) OR
    (public.is_admin(auth.uid()))
  );

DROP POLICY IF EXISTS "Enable insert access for anyone" ON public.orders;
CREATE POLICY "Enable insert access for anyone" ON public.orders
  FOR INSERT
  WITH CHECK (
    (user_id IS NULL) OR 
    (auth.uid() = user_id) OR
    (public.is_admin(auth.uid()))
  );

DROP POLICY IF EXISTS "Enable update access for admins" ON public.orders;
CREATE POLICY "Enable update access for admins" ON public.orders
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Enable delete access for admins" ON public.orders;
CREATE POLICY "Enable delete access for admins" ON public.orders
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- B. Order Items Policies
DROP POLICY IF EXISTS "Enable read access for order item owners" ON public.order_items;
CREATE POLICY "Enable read access for order item owners" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid())
    ) OR
    (public.is_admin(auth.uid()))
  );

DROP POLICY IF EXISTS "Enable insert access for order item creators" ON public.order_items;
CREATE POLICY "Enable insert access for order item creators" ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (
          (orders.user_id IS NULL) OR 
          (orders.user_id = auth.uid())
        )
    ) OR
    (public.is_admin(auth.uid()))
  );

DROP POLICY IF EXISTS "Enable update access for admins" ON public.order_items;
CREATE POLICY "Enable update access for admins" ON public.order_items
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Enable delete access for admins" ON public.order_items;
CREATE POLICY "Enable delete access for admins" ON public.order_items
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- C. Order Status History Policies
DROP POLICY IF EXISTS "Enable read access to status history for order owners" ON public.order_status_history;
CREATE POLICY "Enable read access to status history for order owners" ON public.order_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
        AND (orders.user_id = auth.uid())
    ) OR
    (public.is_admin(auth.uid()))
  );

DROP POLICY IF EXISTS "Enable insert access to status history for admins" ON public.order_status_history;
CREATE POLICY "Enable insert access to status history for admins" ON public.order_status_history
  FOR INSERT
  WITH CHECK (
    (public.is_admin(auth.uid()))
  );

DROP POLICY IF EXISTS "Enable update access to status history for admins" ON public.order_status_history;
CREATE POLICY "Enable update access to status history for admins" ON public.order_status_history
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Enable delete access to status history for admins" ON public.order_status_history;
CREATE POLICY "Enable delete access to status history for admins" ON public.order_status_history
  FOR DELETE
  USING (public.is_admin(auth.uid()));
