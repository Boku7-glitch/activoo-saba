
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('parent', 'school');
CREATE TYPE public.class_category AS ENUM ('creativity','it','sports','development','languages');
CREATE TYPE public.class_format AS ENUM ('group','individual');
CREATE TYPE public.lead_status AS ENUM ('new','contacted','closed');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view their own roles"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users assign their own roles on signup"
  ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ SCHOOLS ============
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  district TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  rating NUMERIC(2,1) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools viewable by everyone"
  ON public.schools FOR SELECT USING (true);
CREATE POLICY "Owners insert their school"
  ON public.schools FOR INSERT WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(),'school'));
CREATE POLICY "Owners update their school"
  ON public.schools FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners delete their school"
  ON public.schools FOR DELETE USING (auth.uid() = owner_id);

-- ============ CLASSES ============
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category class_category NOT NULL,
  description TEXT,
  age_min INT NOT NULL DEFAULT 3,
  age_max INT NOT NULL DEFAULT 14,
  price_from INT NOT NULL DEFAULT 0,
  format class_format NOT NULL DEFAULT 'group',
  language TEXT DEFAULT 'English',
  schedule TEXT,
  image_url TEXT,
  benefits TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classes viewable by everyone"
  ON public.classes FOR SELECT USING (true);
CREATE POLICY "School owners insert classes"
  ON public.classes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.owner_id = auth.uid())
  );
CREATE POLICY "School owners update classes"
  ON public.classes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.owner_id = auth.uid())
  );
CREATE POLICY "School owners delete classes"
  ON public.classes FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.owner_id = auth.uid())
  );

-- ============ LEADS ============
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  child_age INT,
  message TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a lead"
  ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "School owners view their leads"
  ON public.leads FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.owner_id = auth.uid())
  );
CREATE POLICY "Parents view their own leads"
  ON public.leads FOR SELECT USING (auth.uid() = parent_user_id);
CREATE POLICY "School owners update their leads"
  ON public.leads FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.owner_id = auth.uid())
  );

-- ============ SAVED CLASSES ============
CREATE TABLE public.saved_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_id)
);
ALTER TABLE public.saved_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their saved classes select"
  ON public.saved_classes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage their saved classes insert"
  ON public.saved_classes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage their saved classes delete"
  ON public.saved_classes FOR DELETE USING (auth.uid() = user_id);

-- ============ VIEWED HISTORY ============
CREATE TABLE public.viewed_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.viewed_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own history"
  ON public.viewed_classes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert into their own history"
  ON public.viewed_classes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER schools_touch BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER classes_touch BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
