ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS lesson_duration_min integer,
  ADD COLUMN IF NOT EXISTS lessons_per_week integer;