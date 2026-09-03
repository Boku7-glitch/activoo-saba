ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_whatsapp text,
  ADD COLUMN IF NOT EXISTS contact_facebook text,
  ADD COLUMN IF NOT EXISTS contact_instagram text,
  ADD COLUMN IF NOT EXISTS ask_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS open_lesson text,
  ADD COLUMN IF NOT EXISTS open_lesson_en text,
  ADD COLUMN IF NOT EXISTS free_trial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_trial_note text,
  ADD COLUMN IF NOT EXISTS free_trial_note_en text;