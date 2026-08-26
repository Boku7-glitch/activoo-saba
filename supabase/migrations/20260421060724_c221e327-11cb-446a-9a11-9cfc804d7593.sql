
-- Fix mutable search_path on the trigger function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Tighten lead INSERT: ensure class & school actually exist and match
DROP POLICY IF EXISTS "Anyone can create a lead" ON public.leads;
CREATE POLICY "Anyone can create a valid lead"
  ON public.leads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_id AND c.school_id = leads.school_id
    )
    AND char_length(parent_name) BETWEEN 1 AND 100
    AND char_length(parent_phone) BETWEEN 4 AND 30
    AND (message IS NULL OR char_length(message) <= 1000)
  );
