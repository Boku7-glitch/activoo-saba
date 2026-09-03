
ALTER TABLE public.schools ALTER COLUMN slug SET DEFAULT '';

CREATE OR REPLACE FUNCTION public.slugify(txt TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(txt,'')), '[^a-z0-9]+', '-', 'g'));
$$;

REVOKE EXECUTE ON FUNCTION public.slugify(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schools_set_slug() FROM PUBLIC, anon, authenticated;
