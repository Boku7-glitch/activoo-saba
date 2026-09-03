CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_en text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cities TO authenticated;
GRANT ALL ON public.cities TO service_role;

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are viewable by everyone" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Admins can insert cities" ON public.cities FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update cities" ON public.cities FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete cities" ON public.cities FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_cities_updated_at BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  name_en text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city_id, slug)
);

GRANT SELECT ON public.districts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.districts TO authenticated;
GRANT ALL ON public.districts TO service_role;

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Districts are viewable by everyone" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Admins can insert districts" ON public.districts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update districts" ON public.districts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete districts" ON public.districts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_districts_updated_at BEFORE UPDATE ON public.districts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX districts_city_id_idx ON public.districts(city_id);

INSERT INTO public.cities (slug, name, name_en, sort_order) VALUES ('tbilisi', 'თბილისი', 'Tbilisi', 1);

INSERT INTO public.districts (city_id, slug, name, name_en, sort_order)
SELECT c.id, d.slug, d.name, d.name_en, d.sort_order
FROM public.cities c,
(VALUES
  ('vake', 'ვაკე', 'Vake', 1),
  ('saburtalo', 'საბურთალო', 'Saburtalo', 2),
  ('vera', 'ვერა', 'Vera', 3),
  ('didi-dighomi', 'დიდი დიღომი', 'Didi Dighomi', 4),
  ('old-tbilisi', 'ძველი თბილისი', 'Old Tbilisi', 5),
  ('isani', 'ისანი', 'Isani', 6),
  ('gldani', 'გლდანი', 'Gldani', 7),
  ('nadzaladevi', 'ნაძალადევი', 'Nadzaladevi', 8),
  ('samgori', 'სამგორი', 'Samgori', 9),
  ('chughureti', 'ჩუღურეთი', 'Chughureti', 10),
  ('mtatsminda', 'მთაწმინდა', 'Mtatsminda', 11),
  ('krtsanisi', 'კრწანისი', 'Krtsanisi', 12)
) AS d(slug, name, name_en, sort_order)
WHERE c.slug = 'tbilisi';