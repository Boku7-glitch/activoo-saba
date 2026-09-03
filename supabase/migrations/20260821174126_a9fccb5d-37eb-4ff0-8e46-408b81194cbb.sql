CREATE OR REPLACE FUNCTION public.guard_class_promo_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_featured := false;
    NEW.is_new := COALESCE(NEW.is_new, false);
    NEW.is_new := false;
  ELSE
    NEW.is_featured := OLD.is_featured;
    NEW.is_new := OLD.is_new;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_class_promo_flags_trg ON public.classes;
CREATE TRIGGER guard_class_promo_flags_trg
BEFORE INSERT OR UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.guard_class_promo_flags();