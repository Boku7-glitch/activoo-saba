ALTER TABLE public.views ADD COLUMN IF NOT EXISTS icon_url text;
ALTER TABLE public.view_categories ADD COLUMN IF NOT EXISTS icon_url text;
ALTER TABLE public.view_subcategories ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.view_subcategories ADD COLUMN IF NOT EXISTS icon_url text;