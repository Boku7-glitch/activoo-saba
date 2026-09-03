ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

CREATE INDEX IF NOT EXISTS schools_deleted_at_idx ON public.schools (deleted_at);
CREATE INDEX IF NOT EXISTS classes_deleted_at_idx ON public.classes (deleted_at);

-- Public read: hide soft-deleted rows; owners and admins still see theirs
DROP POLICY IF EXISTS "Schools viewable by everyone" ON public.schools;
CREATE POLICY "Schools viewable by everyone"
  ON public.schools FOR SELECT
  USING (deleted_at IS NULL OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Classes viewable by everyone" ON public.classes;
CREATE POLICY "Classes viewable by everyone"
  ON public.classes FOR SELECT
  USING (
    deleted_at IS NULL
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.schools s WHERE s.id = classes.school_id AND s.owner_id = auth.uid())
  );

-- Owners must soft-delete; only admins can erase permanently
DROP POLICY IF EXISTS "Owners delete their school" ON public.schools;
DROP POLICY IF EXISTS "School owners delete classes" ON public.classes;