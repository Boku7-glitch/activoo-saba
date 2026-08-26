
-- Views (4 osnovnye razdela saita)
CREATE TABLE public.views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'Sparkles',
  accent_hex text NOT NULL DEFAULT '#005DFF',
  accent_secondary_hex text NOT NULL DEFAULT '#818AFA',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.view_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id uuid NOT NULL REFERENCES public.views(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '✨',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (view_id, slug)
);

CREATE TABLE public.view_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.view_categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

CREATE TABLE public.view_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id uuid NOT NULL REFERENCES public.views(id) ON DELETE CASCADE,
  filter_type text NOT NULL CHECK (filter_type IN ('age','district','price','subcategory')),
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (view_id, filter_type)
);

-- Linkovat klassy s view i podkategoriei
ALTER TABLE public.classes
  ADD COLUMN view_id uuid REFERENCES public.views(id) ON DELETE SET NULL,
  ADD COLUMN subcategory_id uuid REFERENCES public.view_subcategories(id) ON DELETE SET NULL;

CREATE INDEX idx_classes_view_id ON public.classes(view_id);
CREATE INDEX idx_view_categories_view ON public.view_categories(view_id, sort_order);
CREATE INDEX idx_view_subcategories_cat ON public.view_subcategories(category_id, sort_order);

-- RLS
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Views readable by everyone" ON public.views FOR SELECT USING (true);
CREATE POLICY "Admins insert views" ON public.views FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update views" ON public.views FOR UPDATE USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete views" ON public.views FOR DELETE USING (has_role(auth.uid(),'admin'));

CREATE POLICY "View cats readable by everyone" ON public.view_categories FOR SELECT USING (true);
CREATE POLICY "Admins insert view cats" ON public.view_categories FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update view cats" ON public.view_categories FOR UPDATE USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete view cats" ON public.view_categories FOR DELETE USING (has_role(auth.uid(),'admin'));

CREATE POLICY "View subcats readable by everyone" ON public.view_subcategories FOR SELECT USING (true);
CREATE POLICY "Admins insert view subcats" ON public.view_subcategories FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update view subcats" ON public.view_subcategories FOR UPDATE USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete view subcats" ON public.view_subcategories FOR DELETE USING (has_role(auth.uid(),'admin'));

CREATE POLICY "View filters readable by everyone" ON public.view_filters FOR SELECT USING (true);
CREATE POLICY "Admins insert view filters" ON public.view_filters FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update view filters" ON public.view_filters FOR UPDATE USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete view filters" ON public.view_filters FOR DELETE USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_views_touch BEFORE UPDATE ON public.views
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_view_categories_touch BEFORE UPDATE ON public.view_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed: 4 views
INSERT INTO public.views (slug, name, icon, accent_hex, accent_secondary_hex, sort_order) VALUES
  ('education',    'Education',    'GraduationCap', '#005DFF', '#818AFA', 1),
  ('activity',     'Activity',     'Activity',      '#7CB342', '#EBF76C', 2),
  ('masterclass',  'Masterclasses','Sparkles',      '#A855F7', '#D8AEFB', 3),
  ('services',     'Services',     'Briefcase',     '#6366F1', '#818AFA', 4);

-- Seed kategorii dlia Education
WITH v AS (SELECT id FROM public.views WHERE slug='education')
INSERT INTO public.view_categories (view_id, slug, name, icon, sort_order)
SELECT v.id, x.slug, x.name, x.icon, x.so FROM v, (VALUES
  ('languages',     'Languages',     '🌍', 1),
  ('school',        'School subjects','📚', 2),
  ('it',            'IT & Tech',     '💻', 3),
  ('exams',         'Exam prep',     '📝', 4),
  ('soft-skills',   'Soft skills',   '🧠', 5)
) x(slug,name,icon,so);

-- Seed kategorii dlia Activity
WITH v AS (SELECT id FROM public.views WHERE slug='activity')
INSERT INTO public.view_categories (view_id, slug, name, icon, sort_order)
SELECT v.id, x.slug, x.name, x.icon, x.so FROM v, (VALUES
  ('sport',      'Sport',      '⚽', 1),
  ('dance',      'Dance',      '💃', 2),
  ('creativity', 'Creativity', '🎨', 3)
) x(slug,name,icon,so);

-- Seed kategorii dlia Masterclasses
WITH v AS (SELECT id FROM public.views WHERE slug='masterclass')
INSERT INTO public.view_categories (view_id, slug, name, icon, sort_order)
SELECT v.id, x.slug, x.name, x.icon, x.so FROM v, (VALUES
  ('sport-mc',   'Sport',    '🏆', 1),
  ('art-mc',     'Art',      '🖌️', 2),
  ('it-mc',      'IT',       '💡', 3),
  ('cooking',    'Cooking',  '🍳', 4),
  ('science',    'Science',  '🔬', 5)
) x(slug,name,icon,so);

-- Seed kategorii dlia Services
WITH v AS (SELECT id FROM public.views WHERE slug='services')
INSERT INTO public.view_categories (view_id, slug, name, icon, sort_order)
SELECT v.id, x.slug, x.name, x.icon, x.so FROM v, (VALUES
  ('events',          'Events',          '🎉', 1),
  ('camps',           'Camps',           '🏕️', 2),
  ('private-lessons', 'Private lessons', '👤', 3),
  ('tutoring',        'Tutoring',        '📖', 4)
) x(slug,name,icon,so);

-- Seed podkategorii
WITH c AS (SELECT id FROM public.view_categories WHERE slug='languages')
INSERT INTO public.view_subcategories (category_id, slug, name, sort_order)
SELECT c.id, x.slug, x.name, x.so FROM c, (VALUES
  ('english','English',1),('german','German',2),('french','French',3),
  ('spanish','Spanish',4),('russian','Russian',5),('georgian','Georgian',6)
) x(slug,name,so);

WITH c AS (SELECT id FROM public.view_categories WHERE slug='sport')
INSERT INTO public.view_subcategories (category_id, slug, name, sort_order)
SELECT c.id, x.slug, x.name, x.so FROM c, (VALUES
  ('football','Football',1),('basketball','Basketball',2),('swimming','Swimming',3),
  ('tennis','Tennis',4),('karate','Karate',5),('judo','Judo',6)
) x(slug,name,so);

WITH c AS (SELECT id FROM public.view_categories WHERE slug='dance')
INSERT INTO public.view_subcategories (category_id, slug, name, sort_order)
SELECT c.id, x.slug, x.name, x.so FROM c, (VALUES
  ('hiphop','Hip-Hop',1),('ballet','Ballet',2),('latin','Latin',3),('contemporary','Contemporary',4)
) x(slug,name,so);

WITH c AS (SELECT id FROM public.view_categories WHERE slug='it')
INSERT INTO public.view_subcategories (category_id, slug, name, sort_order)
SELECT c.id, x.slug, x.name, x.so FROM c, (VALUES
  ('coding','Coding',1),('robotics','Robotics',2),('design','Design',3),('ai','AI',4)
) x(slug,name,so);

-- Seed filtri (vse vklucheni dlya vseh views)
INSERT INTO public.view_filters (view_id, filter_type, is_enabled, sort_order)
SELECT v.id, ft.t, true, ft.so FROM public.views v
CROSS JOIN (VALUES ('subcategory',1),('age',2),('district',3),('price',4)) ft(t,so);

-- Migrate sushestvuyushie classes po category USER-DEFINED enum
UPDATE public.classes SET view_id = (SELECT id FROM public.views WHERE slug='education')
  WHERE category::text IN ('it','languages');
UPDATE public.classes SET view_id = (SELECT id FROM public.views WHERE slug='activity')
  WHERE category::text IN ('sports','creativity','development');
