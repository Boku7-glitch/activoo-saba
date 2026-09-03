DROP POLICY IF EXISTS "Users assign their own roles on signup" ON public.user_roles;
CREATE POLICY "Users assign their own non-admin roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role IN ('parent'::app_role, 'school'::app_role));