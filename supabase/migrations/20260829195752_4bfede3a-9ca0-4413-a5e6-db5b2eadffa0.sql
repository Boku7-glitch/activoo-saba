ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS image_caption text,
  ADD COLUMN IF NOT EXISTS image_caption_en text;

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS cover_caption text,
  ADD COLUMN IF NOT EXISTS cover_caption_en text;