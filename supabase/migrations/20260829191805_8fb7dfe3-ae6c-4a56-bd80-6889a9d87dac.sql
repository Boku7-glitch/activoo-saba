ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS free_lesson_slots jsonb NOT NULL DEFAULT '[]'::jsonb;