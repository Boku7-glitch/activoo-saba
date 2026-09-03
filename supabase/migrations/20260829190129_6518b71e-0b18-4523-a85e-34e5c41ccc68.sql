CREATE OR REPLACE FUNCTION public.increment_class_view(_class_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.classes SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = _class_id AND is_visible = true AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.increment_class_view(uuid) TO anon, authenticated;