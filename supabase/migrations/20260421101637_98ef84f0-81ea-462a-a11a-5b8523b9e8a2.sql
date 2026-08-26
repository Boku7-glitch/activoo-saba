-- 2. Promote specific email to admin (if user exists)
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'st.ulia063@gmail.com' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- 3. site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings readable by everyone"
  ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Admins insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete site settings"
  ON public.site_settings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed default copy
INSERT INTO public.site_settings (key, value) VALUES
  ('hero_title', '{"text": "Find the perfect class for your child in 1 minute"}'::jsonb),
  ('hero_subtitle', '{"text": "Dance, IT, sports, languages and more — near you, trusted by parents."}'::jsonb),
  ('default_location', '{"text": "Tbilisi, Georgia"}'::jsonb),
  ('for_schools_title', '{"text": "Reach more parents in Tbilisi"}'::jsonb),
  ('for_schools_subtitle', '{"text": "List your classes for free and start receiving leads today."}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Admin RLS policies on existing tables
-- Schools
CREATE POLICY "Admins manage all schools select" ON public.schools FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage all schools insert" ON public.schools FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage all schools update" ON public.schools FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage all schools delete" ON public.schools FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Classes
CREATE POLICY "Admins manage all classes insert" ON public.classes FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage all classes update" ON public.classes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage all classes delete" ON public.classes FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Leads
CREATE POLICY "Admins view all leads" ON public.leads FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update all leads" ON public.leads FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete leads" ON public.leads FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Profiles
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete any profile" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- User roles
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Saved classes
CREATE POLICY "Admins view all saved classes" ON public.saved_classes FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
