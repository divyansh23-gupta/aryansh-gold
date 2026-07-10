-- =========================================================================
-- MILESTONE 11: RAZORPAY INTEGRATION & ORDER DRAFTS SCHEMA
-- =========================================================================

-- 1. Create payment_status enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM (
      'pending',
      'paid',
      'failed',
      'refunded'
    );
  END IF;
END $$;

-- 2. Create order_drafts table
CREATE TABLE IF NOT EXISTS public.order_drafts (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  cart_items JSONB NOT NULL, -- Snapshot structure: [{variant_id: uuid, quantity: integer}]
  subtotal NUMERIC(12,2) NOT NULL CONSTRAINT chk_drafts_subtotal CHECK (subtotal >= 0),
  shipping_cost NUMERIC(12,2) DEFAULT 99.00 NOT NULL CONSTRAINT chk_drafts_shipping CHECK (shipping_cost >= 0),
  total_amount NUMERIC(12,2) NOT NULL CONSTRAINT chk_drafts_total CHECK (total_amount >= 0),
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'failed', 'inventory_conflict'
  payment_status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
  completed_order_id UUID, -- Will be set after successful order creation
  verification_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Expand public.orders with Razorpay linkage details
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL;

-- 4. Set up completed_order_id foreign key constraint on order_drafts
ALTER TABLE public.order_drafts
  DROP CONSTRAINT IF EXISTS fk_order_drafts_completed_order_id,
  ADD CONSTRAINT fk_order_drafts_completed_order_id FOREIGN KEY (completed_order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.order_drafts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for order_drafts
-- A. Select Policy
DROP POLICY IF EXISTS "Enable read access for draft owners" ON public.order_drafts;
CREATE POLICY "Enable read access for draft owners" ON public.order_drafts
  FOR SELECT
  USING (
    (auth.uid() = user_id) OR
    (public.is_admin(auth.uid()))
  );

-- B. Insert Policy (Allows guests to create drafts)
DROP POLICY IF EXISTS "Enable insert access for anyone" ON public.order_drafts;
CREATE POLICY "Enable insert access for anyone" ON public.order_drafts
  FOR INSERT
  WITH CHECK (
    (user_id IS NULL) OR 
    (auth.uid() = user_id) OR
    (public.is_admin(auth.uid()))
  );

-- C. Update Policy (Admins can resolve conflicts, and edge function system can update)
DROP POLICY IF EXISTS "Enable update access for admins and system" ON public.order_drafts;
CREATE POLICY "Enable update access for admins and system" ON public.order_drafts
  FOR UPDATE
  USING (
    (public.is_admin(auth.uid())) OR
    (auth.uid() IS NULL) -- Allow system edge functions running under service role
  );

-- 7. Add updated_at trigger
DROP TRIGGER IF EXISTS order_drafts_set_updated_at ON public.order_drafts;
CREATE TRIGGER order_drafts_set_updated_at 
  BEFORE UPDATE ON public.order_drafts 
  FOR EACH ROW 
  EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

-- 8. Create search optimization indexes
CREATE INDEX IF NOT EXISTS idx_order_drafts_rp_id ON public.order_drafts(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_order_drafts_user_id ON public.order_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_order_drafts_status ON public.order_drafts(status);
CREATE INDEX IF NOT EXISTS idx_order_drafts_created_at ON public.order_drafts(created_at DESC);
