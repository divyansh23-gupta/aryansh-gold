-- Create reels table
CREATE TABLE public.reels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  reel_url TEXT NOT NULL,
  thumbnail_url TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexing for performance
CREATE INDEX reels_is_active_idx ON public.reels(is_active);

-- Enable RLS
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow anon/public select for active reels, and full read for admins
CREATE POLICY "Allow public select for active reels"
  ON public.reels
  FOR SELECT
  USING (is_active = true OR (auth.uid() IS NOT NULL AND public.is_admin(auth.uid())));

-- Admin policies: Allow full write access to administrators
CREATE POLICY "Allow admins all operations on reels"
  ON public.reels
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Trigger for updated_at modification tracking
CREATE TRIGGER set_reels_updated_at
  BEFORE UPDATE ON public.reels
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();
