
-- 1. SECURITY DEFINER trigger helpers should not be directly callable
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_class_promo_flags() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_review_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schools_set_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- 2. Leads: authenticated only, tied to the submitting user
DROP POLICY IF EXISTS "Anyone can create a valid lead" ON public.leads;
CREATE POLICY "Authenticated users create their own lead"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (
  parent_user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = leads.class_id AND c.school_id = leads.school_id AND c.deleted_at IS NULL)
  AND char_length(parent_name) BETWEEN 1 AND 100
  AND char_length(parent_phone) BETWEEN 4 AND 30
  AND (message IS NULL OR char_length(message) <= 1000)
  AND (child_age IS NULL OR (child_age BETWEEN 0 AND 25))
);
REVOKE INSERT ON public.leads FROM anon;

-- 3. Profiles: owner + admin only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.profiles FROM anon;

-- 4. Schools: hide contact email/phone from anonymous visitors
REVOKE SELECT ON public.schools FROM anon;
GRANT SELECT (
  id, owner_id, name, description, district, address, rating, review_count,
  created_at, updated_at, lat, lng, image_url, website, working_hours,
  name_en, description_en, district_en, address_en, working_hours_en, slug,
  logo_url, cover_image_url, verified, social_links, about, about_en,
  city, city_en, deleted_at, deleted_by
) ON public.schools TO anon;
GRANT SELECT ON public.schools TO authenticated;

-- 5. Storage: school owners can only write inside their own user folder
DROP POLICY IF EXISTS "School owners upload public images" ON storage.objects;
DROP POLICY IF EXISTS "School owners update public images" ON storage.objects;
CREATE POLICY "School owners upload own folder public images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'public-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'school')
);
CREATE POLICY "School owners update own folder public images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'public-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'school')
)
WITH CHECK (
  bucket_id = 'public-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'school')
);
CREATE POLICY "School owners delete own folder public images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'public-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'school')
);
