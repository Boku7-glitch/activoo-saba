-- 1. New editable content columns on classes
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS syllabus jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extra_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reviews_enabled boolean NOT NULL DEFAULT true;

-- 2. Teachers
CREATE TABLE IF NOT EXISTS public.class_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  first_name_en text,
  last_name_en text,
  bio text,
  bio_en text,
  photo_url text,
  video_url text,
  credentials text[] NOT NULL DEFAULT '{}',
  credentials_en text[] NOT NULL DEFAULT '{}',
  certificates text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.class_teachers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_teachers TO authenticated;
GRANT ALL ON public.class_teachers TO service_role;

ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers are publicly readable"
  ON public.class_teachers FOR SELECT USING (true);

CREATE POLICY "Admins and school owners manage teachers"
  ON public.class_teachers FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.schools s ON s.id = c.school_id
      WHERE c.id = class_teachers.class_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.schools s ON s.id = c.school_id
      WHERE c.id = class_teachers.class_id AND s.owner_id = auth.uid()
    )
  );

CREATE TRIGGER class_teachers_touch BEFORE UPDATE ON public.class_teachers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS class_teachers_class_idx ON public.class_teachers(class_id);

-- 3. Reviews
CREATE TABLE IF NOT EXISTS public.class_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, user_id)
);

GRANT SELECT ON public.class_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_reviews TO authenticated;
GRANT ALL ON public.class_reviews TO service_role;

ALTER TABLE public.class_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON public.class_reviews FOR SELECT USING (true);

CREATE POLICY "Signed-in users create their own review"
  ON public.class_reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.reviews_enabled)
  );

CREATE POLICY "Users update their own review"
  ON public.class_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users, owners and admins delete reviews"
  ON public.class_reviews FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.schools s WHERE s.id = class_reviews.school_id AND s.owner_id = auth.uid())
  );

CREATE TRIGGER class_reviews_touch BEFORE UPDATE ON public.class_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS class_reviews_class_idx ON public.class_reviews(class_id);
CREATE INDEX IF NOT EXISTS class_reviews_school_idx ON public.class_reviews(school_id);

-- 4. Aggregate ratings
CREATE OR REPLACE FUNCTION public.recalc_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class uuid := COALESCE(NEW.class_id, OLD.class_id);
  v_school uuid := COALESCE(NEW.school_id, OLD.school_id);
BEGIN
  UPDATE public.classes c
  SET rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.class_reviews r WHERE r.class_id = v_class), 0),
      review_count = (SELECT COUNT(*) FROM public.class_reviews r WHERE r.class_id = v_class)
  WHERE c.id = v_class;

  UPDATE public.schools s
  SET rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.class_reviews r WHERE r.school_id = v_school), 0),
      review_count = (SELECT COUNT(*) FROM public.class_reviews r WHERE r.school_id = v_school)
  WHERE s.id = v_school;

  RETURN NULL;
END; $$;

CREATE TRIGGER class_reviews_stats
AFTER INSERT OR UPDATE OR DELETE ON public.class_reviews
FOR EACH ROW EXECUTE FUNCTION public.recalc_review_stats();