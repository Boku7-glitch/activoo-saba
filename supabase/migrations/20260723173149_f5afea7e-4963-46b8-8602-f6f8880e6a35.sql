
-- Phase 1: Audit fixes

-- 1. Attach handle_new_user trigger to auth.users (was defined but never wired)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Attach touch_updated_at triggers to every table with updated_at
DROP TRIGGER IF EXISTS touch_classes_updated_at ON public.classes;
CREATE TRIGGER touch_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_schools_updated_at ON public.schools;
CREATE TRIGGER touch_schools_updated_at BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_profiles_updated_at ON public.profiles;
CREATE TRIGGER touch_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER touch_site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Backfill profiles for existing auth users that lack one
INSERT INTO public.profiles (id, full_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name','')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 4. Lock down SECURITY DEFINER functions that should only run as triggers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
-- has_role is called from RLS policies and can also be useful from clients; keep it callable by authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- 5. Add missing indexes on foreign keys / common filter columns
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_view_id ON public.classes(view_id);
CREATE INDEX IF NOT EXISTS idx_classes_is_visible ON public.classes(is_visible);
CREATE INDEX IF NOT EXISTS idx_classes_category_ids ON public.classes USING GIN(category_ids);
CREATE INDEX IF NOT EXISTS idx_classes_subcategory_ids ON public.classes USING GIN(subcategory_ids);
CREATE INDEX IF NOT EXISTS idx_leads_class_id ON public.leads(class_id);
CREATE INDEX IF NOT EXISTS idx_leads_school_id ON public.leads(school_id);
CREATE INDEX IF NOT EXISTS idx_leads_parent_user_id ON public.leads(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_saved_classes_user_id ON public.saved_classes(user_id);
CREATE INDEX IF NOT EXISTS idx_viewed_classes_user_id ON public.viewed_classes(user_id);
CREATE INDEX IF NOT EXISTS idx_schools_owner_id ON public.schools(owner_id);
CREATE INDEX IF NOT EXISTS idx_view_categories_view_id ON public.view_categories(view_id);
CREATE INDEX IF NOT EXISTS idx_view_subcategories_category_id ON public.view_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_view_filters_view_id ON public.view_filters(view_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
