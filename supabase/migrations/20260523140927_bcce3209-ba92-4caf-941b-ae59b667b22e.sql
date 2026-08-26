
-- Schools: extended fields
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS working_hours text;

-- Classes: gallery field
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS gallery text[];

-- Storage bucket for site images (logos, school photos, class covers, gallery, content)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-images', 'public-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "Public images are viewable by everyone" ON storage.objects;
CREATE POLICY "Public images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-images');

-- Admins can write
DROP POLICY IF EXISTS "Admins upload public images" ON storage.objects;
CREATE POLICY "Admins upload public images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public-images' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update public images" ON storage.objects;
CREATE POLICY "Admins update public images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'public-images' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete public images" ON storage.objects;
CREATE POLICY "Admins delete public images"
ON storage.objects FOR DELETE
USING (bucket_id = 'public-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- School owners can also upload images for their own school
DROP POLICY IF EXISTS "School owners upload public images" ON storage.objects;
CREATE POLICY "School owners upload public images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public-images' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "School owners update public images" ON storage.objects;
CREATE POLICY "School owners update public images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'public-images' AND auth.uid() IS NOT NULL);
