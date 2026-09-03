ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS price_group integer,
  ADD COLUMN IF NOT EXISTS price_individual integer;