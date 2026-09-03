ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

UPDATE public.classes SET approval_status = 'approved' WHERE approval_status = 'pending';

CREATE OR REPLACE FUNCTION public.guard_class_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    IF NEW.approval_status IS DISTINCT FROM COALESCE(OLD.approval_status, '') THEN
      NEW.reviewed_at := now();
      NEW.reviewed_by := auth.uid();
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.approval_status := 'pending';
    NEW.rejection_reason := NULL;
    NEW.reviewed_at := NULL;
    NEW.reviewed_by := NULL;
  ELSE
    IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
      NEW.approval_status := OLD.approval_status;
    END IF;
    -- any owner edit sends the club back to moderation
    IF OLD.approval_status = 'approved' THEN
      NEW.approval_status := 'pending';
    END IF;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.reviewed_by := OLD.reviewed_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_class_approval_trg ON public.classes;
CREATE TRIGGER guard_class_approval_trg
BEFORE INSERT OR UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.guard_class_approval();