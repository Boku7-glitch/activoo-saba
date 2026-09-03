ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS lead_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.bump_class_lead_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.classes SET lead_count = COALESCE(lead_count, 0) + 1 WHERE id = NEW.class_id;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.bump_class_lead_count() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS leads_bump_class_count ON public.leads;
CREATE TRIGGER leads_bump_class_count
AFTER INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.bump_class_lead_count();

UPDATE public.classes c
SET lead_count = COALESCE((SELECT COUNT(*) FROM public.leads l WHERE l.class_id = c.id), 0);