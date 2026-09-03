-- ==============================================================================
-- ACTIVOO — COMPLETE MASTER SUPABASE SETUP SCRIPT
-- Run this script in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- Safe to run on fresh databases or existing instances (uses IF NOT EXISTS / OR REPLACE)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('parent', 'school', 'admin');
  ELSE
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_category') THEN
    CREATE TYPE public.class_category AS ENUM ('creativity', 'it', 'sports', 'development', 'languages');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_format') THEN
    CREATE TYPE public.class_format AS ENUM ('group', 'individual');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'closed');
  END IF;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update their own profile" ON public.profiles;
CREATE POLICY "Users update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert their own profile" ON public.profiles;
CREATE POLICY "Users insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. USER ROLES TABLE & SECURITY DEFINERS
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'::public.app_role)
$$;

DROP POLICY IF EXISTS "Users view their own roles" ON public.user_roles;
CREATE POLICY "Users view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users assign their own roles on signup" ON public.user_roles;
CREATE POLICY "Users assign their own roles on signup" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- 5. CITIES & DISTRICTS TABLES
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Cities viewable by everyone" ON public.cities;
CREATE POLICY "Cities viewable by everyone" ON public.cities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage cities" ON public.cities;
CREATE POLICY "Admins manage cities" ON public.cities FOR ALL USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE;
ALTER TABLE public.districts ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.districts ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.districts ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.districts(id) ON DELETE SET NULL;
ALTER TABLE public.districts ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE public.districts ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.districts ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.districts ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

DROP POLICY IF EXISTS "Districts viewable by everyone" ON public.districts;
CREATE POLICY "Districts viewable by everyone" ON public.districts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage districts" ON public.districts;
CREATE POLICY "Admins manage districts" ON public.districts FOR ALL USING (public.is_admin());

-- 6. VIEWS & CATEGORIES TAXONOMY
CREATE TABLE IF NOT EXISTS public.views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  accent_hex TEXT NOT NULL DEFAULT '#7c3aed',
  accent_secondary_hex TEXT NOT NULL DEFAULT '#a855f7',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.views ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.views ADD COLUMN IF NOT EXISTS accent_hex TEXT NOT NULL DEFAULT '#7c3aed';
ALTER TABLE public.views ADD COLUMN IF NOT EXISTS accent_secondary_hex TEXT NOT NULL DEFAULT '#a855f7';
ALTER TABLE public.views ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE public.views ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Views viewable by everyone" ON public.views;
CREATE POLICY "Views viewable by everyone" ON public.views FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage views" ON public.views;
CREATE POLICY "Admins manage views" ON public.views FOR ALL USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.view_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id UUID REFERENCES public.views(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL,
  icon TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.view_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_categories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.view_categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.view_categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.view_categories ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE public.view_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "View categories viewable by everyone" ON public.view_categories;
CREATE POLICY "View categories viewable by everyone" ON public.view_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage view categories" ON public.view_categories;
CREATE POLICY "Admins manage view categories" ON public.view_categories FOR ALL USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.view_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.view_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL,
  icon TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.view_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_subcategories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.view_subcategories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.view_subcategories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.view_subcategories ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE public.view_subcategories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "View subcategories viewable by everyone" ON public.view_subcategories;
CREATE POLICY "View subcategories viewable by everyone" ON public.view_subcategories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage view subcategories" ON public.view_subcategories;
CREATE POLICY "Admins manage view subcategories" ON public.view_subcategories FOR ALL USING (public.is_admin());

-- 7. SCHOOLS TABLE
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE,
  district TEXT NOT NULL,
  district_en TEXT,
  city TEXT DEFAULT 'Tbilisi',
  city_en TEXT DEFAULT 'Tbilisi',
  address TEXT,
  address_en TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  working_hours TEXT,
  working_hours_json JSONB,
  social_links JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  description_en TEXT,
  about TEXT,
  about_en TEXT,
  image_url TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 5.0,
  review_count INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Ensure all columns exist on existing schools table
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS district_en TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Tbilisi';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS city_en TEXT DEFAULT 'Tbilisi';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS address_en TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS working_hours TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS working_hours_json JSONB;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS about TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS about_en TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.0;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Published schools are viewable by everyone" ON public.schools;
CREATE POLICY "Published schools are viewable by everyone" ON public.schools
  FOR SELECT USING (
    (deleted_at IS NULL AND is_visible = true)
    OR (auth.uid() IS NOT NULL AND auth.uid() = owner_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Owners can insert school" ON public.schools;
CREATE POLICY "Owners can insert school" ON public.schools
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (auth.uid() = owner_id OR public.is_admin()));

DROP POLICY IF EXISTS "Owners and admins can update school" ON public.schools;
CREATE POLICY "Owners and admins can update school" ON public.schools
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can delete school" ON public.schools;
CREATE POLICY "Admins can delete school" ON public.schools
  FOR DELETE USING (public.is_admin());

-- 8. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  view_id UUID REFERENCES public.views(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.view_subcategories(id) ON DELETE SET NULL,
  subcategory_ids TEXT[] DEFAULT '{}',
  title TEXT NOT NULL,
  title_en TEXT,
  category public.class_category NOT NULL DEFAULT 'it',
  category_ids TEXT[] DEFAULT '{}',
  format public.class_format NOT NULL DEFAULT 'group',
  formats TEXT[] DEFAULT ARRAY['group'],
  age_min INT NOT NULL DEFAULT 6,
  age_max INT NOT NULL DEFAULT 16,
  price_from NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_group NUMERIC(10,2),
  price_individual NUMERIC(10,2),
  lesson_duration_min INT,
  lessons_per_week INT,
  description TEXT,
  description_en TEXT,
  image_url TEXT,
  gallery TEXT[] DEFAULT '{}',
  image_caption TEXT,
  image_caption_en TEXT,
  benefits TEXT[] DEFAULT '{}',
  benefits_en TEXT[] DEFAULT '{}',
  highlights JSONB DEFAULT '[]'::jsonb,
  syllabus JSONB DEFAULT '[]'::jsonb,
  extra_details JSONB DEFAULT '[]'::jsonb,
  schedule TEXT,
  schedule_en TEXT,
  schedule_days JSONB DEFAULT '[]'::jsonb,
  open_lesson TEXT,
  open_lesson_en TEXT,
  free_trial BOOLEAN NOT NULL DEFAULT false,
  free_trial_note TEXT,
  free_trial_note_en TEXT,
  free_lesson_slots JSONB DEFAULT '[]'::jsonb,
  ask_enabled BOOLEAN NOT NULL DEFAULT true,
  reviews_enabled BOOLEAN NOT NULL DEFAULT true,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  contact_facebook TEXT,
  contact_instagram TEXT,
  contact_tiktok TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  approval_status TEXT NOT NULL DEFAULT 'approved',
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  view_count INT DEFAULT 0,
  lead_count INT NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 5.0,
  review_count INT NOT NULL DEFAULT 0,
  language TEXT DEFAULT 'ka',
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Ensure all columns exist on existing classes table
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS view_id UUID REFERENCES public.views(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.view_subcategories(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS subcategory_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS category_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS formats TEXT[] DEFAULT ARRAY['group'];
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS price_group NUMERIC(10,2);
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS price_individual NUMERIC(10,2);
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS lesson_duration_min INT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS lessons_per_week INT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS image_caption TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS image_caption_en TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS benefits_en TEXT[] DEFAULT '{}';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS syllabus JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS extra_details JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS schedule_en TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS schedule_days JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS open_lesson TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS open_lesson_en TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS free_trial BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS free_trial_note TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS free_trial_note_en TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS free_lesson_slots JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS ask_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS reviews_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS contact_facebook TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS contact_instagram TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS contact_tiktok TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT true;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS lead_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.0;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ka';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Public view approved classes" ON public.classes;
CREATE POLICY "Public view approved classes" ON public.classes
  FOR SELECT USING (
    (deleted_at IS NULL AND is_visible = true AND approval_status = 'approved')
    OR (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.schools WHERE id = classes.school_id AND owner_id = auth.uid()))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "School owners insert class" ON public.classes;
CREATE POLICY "School owners insert class" ON public.classes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.schools WHERE id = classes.school_id AND owner_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "School owners update class" ON public.classes;
CREATE POLICY "School owners update class" ON public.classes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.schools WHERE id = classes.school_id AND owner_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "School owners delete class" ON public.classes;
CREATE POLICY "School owners delete class" ON public.classes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.schools WHERE id = classes.school_id AND owner_id = auth.uid())
    OR public.is_admin()
  );

-- 9. CLASS TEACHERS & TEACHERS
CREATE TABLE IF NOT EXISTS public.class_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  first_name_en TEXT,
  last_name TEXT NOT NULL,
  last_name_en TEXT,
  photo_url TEXT,
  bio TEXT,
  bio_en TEXT,
  credentials TEXT[] DEFAULT '{}',
  credentials_en TEXT[] DEFAULT '{}',
  certificates TEXT[] DEFAULT '{}',
  video_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Class teachers viewable by everyone" ON public.class_teachers;
CREATE POLICY "Class teachers viewable by everyone" ON public.class_teachers FOR SELECT USING (true);

DROP POLICY IF EXISTS "School owners manage class teachers" ON public.class_teachers;
CREATE POLICY "School owners manage class teachers" ON public.class_teachers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.schools s ON s.id = c.school_id
      WHERE c.id = class_teachers.class_id AND (s.owner_id = auth.uid() OR public.is_admin())
    )
  );

-- 10. LEADS TABLE (Parent Inquiries)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  child_age INT,
  message TEXT,
  status public.lead_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Ensure all columns exist on existing leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS parent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS child_age INT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status public.lead_status NOT NULL DEFAULT 'new';

DROP POLICY IF EXISTS "Parents insert leads" ON public.leads;
CREATE POLICY "Parents insert leads" ON public.leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Parents and Schools view relevant leads" ON public.leads;
CREATE POLICY "Parents and Schools view relevant leads" ON public.leads
  FOR SELECT USING (
    auth.uid() = parent_user_id
    OR EXISTS (SELECT 1 FROM public.schools WHERE id = leads.school_id AND owner_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Schools and Admins update leads" ON public.leads;
CREATE POLICY "Schools and Admins update leads" ON public.leads
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.schools WHERE id = leads.school_id AND owner_id = auth.uid())
    OR public.is_admin()
  );

-- 11. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.class_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.class_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.class_reviews;
CREATE POLICY "Reviews viewable by everyone" ON public.class_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users create reviews" ON public.class_reviews;
CREATE POLICY "Authenticated users create reviews" ON public.class_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 12. SAVED & VIEWED CLASSES
CREATE TABLE IF NOT EXISTS public.saved_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_id)
);
ALTER TABLE public.saved_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage saved classes" ON public.saved_classes;
CREATE POLICY "Users manage saved classes" ON public.saved_classes
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.viewed_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_id)
);
ALTER TABLE public.viewed_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage viewed classes" ON public.viewed_classes;
CREATE POLICY "Users manage viewed classes" ON public.viewed_classes
  FOR ALL USING (auth.uid() = user_id);

-- 13. SITE SETTINGS & NAV ITEMS (CMS)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value_ka TEXT NOT NULL DEFAULT '',
  value_en TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.site_settings;
CREATE POLICY "Settings viewable by everyone" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.nav_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL DEFAULT 'header',
  label_ka TEXT NOT NULL,
  label_en TEXT,
  href TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nav items viewable by everyone" ON public.nav_items;
CREATE POLICY "Nav items viewable by everyone" ON public.nav_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage nav items" ON public.nav_items;
CREATE POLICY "Admins manage nav items" ON public.nav_items FOR ALL USING (public.is_admin());

-- 14. AUTH USER PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('class-images', 'class-images', true),
  ('school-logos', 'school-logos', true),
  ('avatars', 'avatars', true),
  ('certificates', 'certificates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access to Class Images" ON storage.objects;
CREATE POLICY "Public Access to Class Images" ON storage.objects FOR SELECT USING (bucket_id IN ('class-images', 'school-logos', 'avatars', 'certificates'));

DROP POLICY IF EXISTS "Authenticated Upload to Storage" ON storage.objects;
CREATE POLICY "Authenticated Upload to Storage" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Update Storage" ON storage.objects;
CREATE POLICY "Authenticated Update Storage" ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated');

-- 16. SEED DEFAULT CMS DATA (Views, Categories, Districts, Site Settings)
INSERT INTO public.views (id, name, name_en, slug, accent_hex, accent_secondary_hex, sort_order)
VALUES
  ('11111111-1111-1111-1111-000000000001', 'განათლება', 'Education', 'education', '#7c3aed', '#a855f7', 10),
  ('11111111-1111-1111-1111-000000000002', 'აქტივობა', 'Activity', 'activity', '#059669', '#10b981', 20),
  ('11111111-1111-1111-1111-000000000003', 'მასტერკლასი', 'Masterclass', 'masterclass', '#d97706', '#f59e0b', 30),
  ('11111111-1111-1111-1111-000000000004', 'სერვისები', 'Services', 'services', '#2563eb', '#3b82f6', 40)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  accent_hex = EXCLUDED.accent_hex,
  accent_secondary_hex = EXCLUDED.accent_secondary_hex,
  sort_order = EXCLUDED.sort_order;

WITH edu AS (SELECT id FROM public.views WHERE slug = 'education' LIMIT 1),
     act AS (SELECT id FROM public.views WHERE slug = 'activity' LIMIT 1),
     mas AS (SELECT id FROM public.views WHERE slug = 'masterclass' LIMIT 1),
     srv AS (SELECT id FROM public.views WHERE slug = 'services' LIMIT 1)
INSERT INTO public.view_categories (view_id, name, name_en, slug, icon, sort_order)
SELECT edu.id, 'რობოტიკა და IT', 'Robotics & IT', 'it', 'Laptop', 10 FROM edu
UNION ALL SELECT edu.id, 'უცხო ენები', 'Foreign Languages', 'languages', 'Languages', 20 FROM edu
UNION ALL SELECT edu.id, 'ხელოვნება და ხატვა', 'Art & Painting', 'art', 'Palette', 30 FROM edu
UNION ALL SELECT act.id, 'სპორტი და ფიტნესი', 'Sports & Fitness', 'sports', 'Trophy', 10 FROM act
UNION ALL SELECT act.id, 'მუსიკა და ვოკალი', 'Music & Vocal', 'music', 'Music', 20 FROM act
UNION ALL SELECT act.id, 'ცეკვა და ქორეოგრაფია', 'Dance & Choreography', 'dance', 'Sparkles', 30 FROM act
UNION ALL SELECT mas.id, 'კულინარია და საკონდიტრო', 'Culinary & Pastry', 'cooking', 'ChefHat', 10 FROM mas
UNION ALL SELECT mas.id, 'კერამიკა და თიხა', 'Ceramics & Pottery', 'pottery', 'Shapes', 20 FROM mas
UNION ALL SELECT srv.id, 'რეპეტიტორები და მომზადება', 'Private Tutoring', 'tutoring', 'BookOpen', 10 FROM srv
UNION ALL SELECT srv.id, 'ლოგოპედი და ფსიქოლოგი', 'Speech Therapist & Psychology', 'speech', 'Smile', 20 FROM srv
ON CONFLICT DO NOTHING;

INSERT INTO public.cities (id, name, name_en, slug, sort_order)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'თბილისი', 'Tbilisi', 'tbilisi', 10),
  ('22222222-2222-2222-2222-222222222222', 'ბათუმი', 'Batumi', 'batumi', 20),
  ('33333333-3333-3333-3333-333333333333', 'ქუთაისი', 'Kutaisi', 'kutaisi', 30)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.districts (city_id, name, name_en, slug, sort_order, lat, lng)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'საბურთალო', 'Saburtalo', 'saburtalo', 10, 41.7285, 44.7578),
  ('11111111-1111-1111-1111-111111111111', 'ვაკე', 'Vake', 'vake', 20, 41.7103, 44.7618),
  ('11111111-1111-1111-1111-111111111111', 'ვერა', 'Vera', 'vera', 30, 41.7082, 44.7828),
  ('11111111-1111-1111-1111-111111111111', 'დიდი დიღომი', 'Didi Dighomi', 'didi-dighomi', 40, 41.7851, 44.7671),
  ('11111111-1111-1111-1111-111111111111', 'მთაწმინდა', 'Mtatsminda', 'mtatsminda', 50, 41.6969, 44.7905),
  ('11111111-1111-1111-1111-111111111111', 'ისანი', 'Isani', 'isani', 60, 41.6888, 44.8388)
ON CONFLICT DO NOTHING;

INSERT INTO public.site_settings (key, value_ka, value_en)
VALUES
  ('hero_title', 'აღმოაჩინე საუკეთესო წრეები შენი შვილისთვის', 'Discover the Best Classes & Activities for Your Child'),
  ('hero_subtitle', 'განათლება, სპორტი, ხელოვნება და მასტერკლასები ერთ სივრცეში', 'Education, sports, arts and masterclasses all in one place across Georgia'),
  ('for_schools_title', 'ხარ სკოლა ან წრის ორგანიზატორი?', 'Are you a school or activity provider?'),
  ('for_schools_subtitle', 'დაამატე შენი კლასები და მოიზიდე ასობით ახალი მოსწავლე მარტივად', 'Register your academy and reach hundreds of motivated parents every week')
ON CONFLICT (key) DO NOTHING;

-- 17. DEMO GOLDEN SCHOOL & CLASS SEED (For Live Demonstration)
INSERT INTO public.schools (
  id, name, name_en, slug, district, district_en, city, city_en, address, address_en,
  phone, email, website, description, description_en, about, about_en, verified, rating, review_count
)
VALUES (
  '69cdccd9-0a62-4f36-b52b-7da9f77f1f9d',
  'CodeKids Tbilisi',
  'CodeKids Tbilisi',
  'codekids-tbilisi',
  'საბურთალო',
  'Saburtalo',
  'თბილისი',
  'Tbilisi',
  'ვაჟა-ფშაველას გამზ. 45',
  'Vazha-Pshavela Ave 45',
  '+995 555 12 34 56',
  'info@codekids.ge',
  'https://codekids.ge',
  'ისწავლეთ პროგრამირება გართობით. Scratch, Python და რობოტიკა ბავშვებისთვის.',
  'Learn to code while having fun. Scratch, Python, and robotics for children.',
  'CodeKids Tbilisi არის წამყვანი ციფრული აკადემია ბავშვებისთვის და მოზარდებისთვის.',
  'CodeKids Tbilisi is a leading digital academy for kids and teens.',
  true,
  4.9,
  96
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.classes (
  id, school_id, title, title_en, category,
  age_min, age_max, price_from, price_group, price_individual, format, formats,
  description, description_en, free_trial, free_trial_note, free_trial_note_en,
  is_new, is_visible, approval_status, view_count, rating, review_count
)
VALUES (
  '69cdccd9-0a62-4f36-b52b-7da9f77f1f90',
  '69cdccd9-0a62-4f36-b52b-7da9f77f1f9d',
  'რობოტიკა და IT საფუძვლები',
  'Robotics and IT Fundamentals',
  'it',
  7,
  12,
  80,
  80,
  150,
  'group',
  ARRAY['group', 'individual'],
  'ისწავლეთ თამაშების და ანიმაციების შექმნა Scratch & Arduino-ს გამოყენებით.',
  'Learn game design and basic robotics with Scratch & Arduino.',
  true,
  'უფასო საცდელი გაკვეთილი ხელმისაწვდომია',
  'Free trial lesson available',
  true,
  true,
  'approved',
  120,
  4.9,
  96
)
ON CONFLICT (id) DO NOTHING;

-- ALL DONE!
SELECT 'ACTIVOO DATABASE SETUP COMPLETE!' as status;
