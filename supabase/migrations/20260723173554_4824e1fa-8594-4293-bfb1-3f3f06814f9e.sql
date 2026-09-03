
-- Multilingual sibling columns (English). Georgian stays as-is; NULL/empty _en falls back to KA.
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS schedule_en text,
  ADD COLUMN IF NOT EXISTS benefits_en text[];

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS district_en text,
  ADD COLUMN IF NOT EXISTS address_en text,
  ADD COLUMN IF NOT EXISTS working_hours_en text;

ALTER TABLE public.views
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text;

ALTER TABLE public.view_categories
  ADD COLUMN IF NOT EXISTS name_en text;

ALTER TABLE public.view_subcategories
  ADD COLUMN IF NOT EXISTS name_en text;

-- site_settings: value is JSONB {text: "..."}; add value_en JSONB for English text.
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS value_en jsonb;

-- Navigation & footer editor
CREATE TABLE IF NOT EXISTS public.nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL CHECK (location IN ('header','footer','social')),
  group_ka text,
  group_en text,
  label_ka text NOT NULL,
  label_en text,
  href text NOT NULL,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.nav_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.nav_items TO authenticated;
GRANT ALL ON public.nav_items TO service_role;

ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible nav items"
  ON public.nav_items FOR SELECT
  USING (is_visible = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage nav items"
  ON public.nav_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_nav_items_location_sort ON public.nav_items(location, sort_order);

DROP TRIGGER IF EXISTS touch_nav_items_updated_at ON public.nav_items;
CREATE TRIGGER touch_nav_items_updated_at BEFORE UPDATE ON public.nav_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed initial rows so the site keeps its current header/footer until admin edits.
INSERT INTO public.nav_items (location, label_ka, label_en, href, sort_order) VALUES
  ('footer','მთავარი','Home','/',1),
  ('footer','ძიება','Search','/search',2),
  ('footer','სმარტ შერჩევა','Smart Match','/match',3),
  ('footer','სკოლებისთვის','For schools','/school/onboarding',4)
ON CONFLICT DO NOTHING;
