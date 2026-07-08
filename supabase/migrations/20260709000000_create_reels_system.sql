-- Create reels table
CREATE TABLE IF NOT EXISTS public.reels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS reels_is_active_idx ON public.reels(is_active);

-- Enable RLS
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow anon/public select for active reels, and full read for admins
DROP POLICY IF EXISTS "Allow public select for active reels" ON public.reels;
CREATE POLICY "Allow public select for active reels"
  ON public.reels
  FOR SELECT
  USING (is_active = true OR (auth.uid() IS NOT NULL AND public.is_admin(auth.uid())));

-- Admin policies: Allow full write access to administrators
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

-- Create reels storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('reels', 'reels', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for storage.objects on reels bucket
DROP POLICY IF EXISTS "Allow public access to reels bucket" ON storage.objects;
CREATE POLICY "Allow public access to reels bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'reels');

DROP POLICY IF EXISTS "Allow authenticated uploads to reels bucket" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to reels bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reels' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated deletes to reels bucket" ON storage.objects;
CREATE POLICY "Allow authenticated deletes to reels bucket" ON storage.objects
  FOR DELETE USING (bucket_id = 'reels' AND auth.role() = 'authenticated');
