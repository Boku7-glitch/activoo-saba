ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS subcategory_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS formats text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS schedule_days jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Backfill formats from existing format enum
UPDATE public.classes SET formats = ARRAY[format::text] WHERE formats = '{}';
-- Backfill subcategory_ids from existing subcategory_id
UPDATE public.classes SET subcategory_ids = ARRAY[subcategory_id] WHERE subcategory_id IS NOT NULL AND subcategory_ids = '{}';

CREATE INDEX IF NOT EXISTS classes_subcategory_ids_idx ON public.classes USING GIN (subcategory_ids);
CREATE INDEX IF NOT EXISTS classes_formats_idx ON public.classes USING GIN (formats);
CREATE INDEX IF NOT EXISTS classes_is_visible_idx ON public.classes (is_visible);