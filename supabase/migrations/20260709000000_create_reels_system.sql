-- Create reels table matching gateway-only requirements
CREATE TABLE IF NOT EXISTS public.reels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT, -- Optional title
  thumbnail_url TEXT NOT NULL,
  instagram_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS reels_is_active_idx ON public.reels(is_active);

-- Enable RLS
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow public/anon read access for active reels
DROP POLICY IF EXISTS "Allow public select for active reels" ON public.reels;
CREATE POLICY "Allow public select for active reels"
  ON public.reels
  FOR SELECT
  USING (is_active = true OR (auth.uid() IS NOT NULL AND public.is_admin(auth.uid())));

-- Admin policies: Allow full write/CRUD access to administrators
DROP POLICY IF EXISTS "Allow admins all operations on reels" ON public.reels;
CREATE POLICY "Allow admins all operations on reels"
  ON public.reels
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Trigger for updated_at modification tracking
DROP TRIGGER IF EXISTS set_reels_updated_at ON public.reels;
CREATE TRIGGER set_reels_updated_at
  BEFORE UPDATE ON public.reels
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();
