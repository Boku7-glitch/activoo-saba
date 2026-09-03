
-- School profile enhancements
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS about TEXT,
  ADD COLUMN IF NOT EXISTS about_en TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS city_en TEXT;

-- Slug generator
CREATE OR REPLACE FUNCTION public.slugify(txt TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(txt,'')), '[^a-z0-9]+', '-', 'g'));
$$;

-- Backfill slug
UPDATE public.schools s
SET slug = COALESCE(
  NULLIF(public.slugify(s.name_en), ''),
  NULLIF(public.slugify(s.name), ''),
  'school'
) || '-' || substr(s.id::text, 1, 6)
WHERE slug IS NULL OR slug = '';

ALTER TABLE public.schools ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS schools_slug_key ON public.schools(slug);

-- Auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.schools_set_slug()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE base TEXT; candidate TEXT; n INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := COALESCE(NULLIF(public.slugify(NEW.name_en),''), NULLIF(public.slugify(NEW.name),''), 'school');
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.schools WHERE slug = candidate AND id <> NEW.id) LOOP
      n := n + 1;
      candidate := base || '-' || n::text;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS schools_set_slug_trg ON public.schools;
CREATE TRIGGER schools_set_slug_trg BEFORE INSERT OR UPDATE OF name, name_en, slug ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.schools_set_slug();

-- Club ratings (optional; used to derive school rating)
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS rating NUMERIC,
  ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;
