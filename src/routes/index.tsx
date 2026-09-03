import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, MapPin, Sparkles, Star, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClassCard, type ClassRow } from "@/components/ClassCard";
import { CardRowSkeleton } from "@/components/Skeletons";
import { SectionHeader } from "@/components/SectionHeader";
import { Logo } from "@/components/Logo";
import { CmsIcon } from "@/components/CmsIcon";
import heroIllustration from "@/assets/hero-illustration.png";
import { useView, useViewCategories } from "@/lib/view-context";
import { ViewTabs } from "@/components/ViewTabs";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/auth-context";
import { useT, useTranslated, useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const GOLDEN_CLASS: ClassRow = {
  id: "test-golden-class-001",
  title: "რობოტიკა და IT საფუძვლები",
  title_en: "Robotics and IT Fundamentals",
  category: "it",
  age_min: 7,
  age_max: 12,
  price_from: 80,
  image_url: null,
  is_new: true,
  schools: {
    name: "CodeKids Tbilisi",
    name_en: "CodeKids Tbilisi",
    district: "Saburtalo",
    district_en: "Saburtalo",
    city: "Tbilisi",
    city_en: "Tbilisi",
    rating: 4.9,
    verified: true,
  },
};

const SAMPLE_CLASSES: ClassRow[] = [
  GOLDEN_CLASS,
  {
    id: "test-coding-002",
    title: "Scratch & Python დამწყებთათვის",
    title_en: "Scratch & Python for Beginners",
    category: "it",
    age_min: 8,
    age_max: 14,
    price_from: 120,
    image_url: null,
    is_new: true,
    schools: { name: "IT Academy Junior", name_en: "IT Academy Junior", district: "Vake", district_en: "Vake", city: "Tbilisi", city_en: "Tbilisi", rating: 4.8, verified: true },
  },
  {
    id: "test-art-003",
    title: "აკვარელი და ფერწერა ბავშვებისთვის",
    title_en: "Watercolor & Painting for Kids",
    category: "creativity",
    age_min: 5,
    age_max: 10,
    price_from: 80,
    image_url: null,
    is_new: false,
    schools: { name: "Art Studio Color", name_en: "Art Studio Color", district: "Vera", district_en: "Vera", city: "Tbilisi", city_en: "Tbilisi", rating: 4.9, verified: true },
  },
  {
    id: "test-sports-004",
    title: "საფეხბურთო სექცია და ტაქტიკა",
    title_en: "Junior Football Section",
    category: "sports",
    age_min: 6,
    age_max: 15,
    price_from: 90,
    image_url: null,
    is_new: false,
    schools: { name: "Champions League Club", name_en: "Champions League Club", district: "Didi Dighomi", district_en: "Didi Dighomi", city: "Tbilisi", city_en: "Tbilisi", rating: 4.7, verified: true },
  },
  {
    id: "test-chess-005",
    title: "ჭადრაკის ლოგიკა და სტრატეგია",
    title_en: "Chess Strategy & Logic",
    category: "development",
    age_min: 5,
    age_max: 12,
    price_from: 70,
    image_url: null,
    is_new: true,
    schools: { name: "Grandmaster Academy", name_en: "Grandmaster Academy", district: "Old Tbilisi", district_en: "Old Tbilisi", city: "Tbilisi", city_en: "Tbilisi", rating: 5.0, verified: true },
  },
  {
    id: "test-lang-006",
    title: "ინგლისური ენა თამაშითა და საუბრით",
    title_en: "English for Kids - Play & Speak",
    category: "languages",
    age_min: 4,
    age_max: 9,
    price_from: 100,
    image_url: null,
    is_new: false,
    schools: { name: "British Language Center", name_en: "British Language Center", district: "Isani", district_en: "Isani", city: "Tbilisi", city_en: "Tbilisi", rating: 4.8, verified: true },
  },
];

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "activoo — Find the perfect class for your child" },
      { name: "description", content: "Browse popular and new classes near you. Dance, IT, sports, languages and more — book in 1 minute." },
      { property: "og:title", content: "activoo — Classes for kids" },
      { property: "og:description", content: "Find the perfect class for your child in 1 minute." },
    ],
  }),
});

interface SettingRow { key: string; value: { text?: string } | null; value_en: { text?: string } | null }

function HomePage() {
  const navigate = useNavigate();
  const t = useT();
  const { lang } = useI18n();
  const { user, role } = useAuth();
  const { activeView } = useView();
  const viewCats = useViewCategories(activeView?.id);
  const [featured, setFeatured] = useState<ClassRow[] | null>(null);
  const [fresh, setFresh] = useState<ClassRow[] | null>(null);
  const [nearby, setNearby] = useState<ClassRow[] | null>(null);
  const [mostViewed, setMostViewed] = useState<ClassRow[] | null>(null);
  const [promoted, setPromoted] = useState<ClassRow[] | null>(null);
  const [promotedIds, setPromotedIds] = useState<string[]>([]);
  const [location, setLocation] = useState("Tbilisi, Georgia");
  const [copyKa, setCopyKa] = useState<Record<string, string>>({});
  const [copyEn, setCopyEn] = useState<Record<string, string>>({});

  const activeViewTitle = activeView
    ? (lang === "en"
        ? (activeView.name_en || VIEW_NAMES_EN[activeView.slug] || VIEW_NAMES_EN[activeView.name] || activeView.name)
        : (VIEW_NAMES_KA[activeView.slug] || activeView.name))
    : t("home.browseCategories");

  useEffect(() => {
    const loc = typeof window !== "undefined" ? window.localStorage.getItem("activoo:location") : null;
    if (loc) setLocation(loc);
  }, []);

  useEffect(() => {
    supabase.from("site_settings").select("*").then(({ data }) => {
      const ka: Record<string, string> = {};
      const en: Record<string, string> = {};
      (data as SettingRow[] | null)?.forEach((s) => {
        ka[s.key] = s.value?.text ?? "";
        en[s.key] = s.value_en?.text ?? "";
        if (s.key === "promoted_classes") {
          const ids = (s.value as { ids?: string[] } | null)?.ids;
          if (Array.isArray(ids)) setPromotedIds(ids);
        }
      });
      setCopyKa(ka);
      setCopyEn(en);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFeatured(null);
    setFresh(null);
    setNearby(null);
    setMostViewed(null);
    const select = "id,title,title_en,category,age_min,age_max,price_from,image_url,is_new,schools(name,name_en,district,district_en,city,city_en,rating,verified)";
    const base = (viewId?: string | null) => {
      let q = supabase.from("classes").select(select).eq("is_visible", true).eq("approval_status", "approved").is("deleted_at", null);
      if (viewId) q = q.eq("view_id", viewId);
      return q;
    };
    const load = (viewId?: string | null) =>
      Promise.all([
        base(viewId).order("lead_count", { ascending: false }).order("rating", { ascending: false }).limit(8),
        base(viewId).order("created_at", { ascending: false }).limit(8),
        base(viewId).order("rating", { ascending: false }).limit(8),
        base(viewId).order("view_count", { ascending: false }).limit(8),
      ]);

    (async () => {
      try {
        let [f, n, near, mv] = await load(activeView?.id);
        // Fallback: if this view has no published classes yet, show classes from all views
        const empty = [f, n, near, mv].every((r) => ((r.data as unknown[] | null) ?? []).length === 0);
        if (empty && activeView?.id) {
          [f, n, near, mv] = await load(null);
        }
        if (cancelled) return;
        const fRows = (f.data as unknown as ClassRow[]) ?? [];
        const nRows = (n.data as unknown as ClassRow[]) ?? [];
        const nearRows = (near.data as unknown as ClassRow[]) ?? [];
        const mvRows = (mv.data as unknown as ClassRow[]) ?? [];

        setFeatured(fRows.length > 0 ? fRows : SAMPLE_CLASSES);
        setFresh(nRows.length > 0 ? nRows : SAMPLE_CLASSES.slice(1));
        setNearby(nearRows.length > 0 ? nearRows : SAMPLE_CLASSES);
        setMostViewed(mvRows.length > 0 ? mvRows : SAMPLE_CLASSES);
      } catch {
        if (cancelled) return;
        setFeatured(SAMPLE_CLASSES);
        setFresh(SAMPLE_CLASSES.slice(1));
        setNearby(SAMPLE_CLASSES);
        setMostViewed(SAMPLE_CLASSES);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeView?.id]);


  useEffect(() => {
    if (promotedIds.length === 0) {
      setPromoted([]);
      return;
    }
    const select = "id,title,title_en,category,age_min,age_max,price_from,image_url,is_new,schools(name,name_en,district,district_en,city,city_en,rating,verified)";
    supabase
      .from("classes")
      .select(select)
      .in("id", promotedIds)
      .eq("is_visible", true)
      .eq("approval_status", "approved")
      .is("deleted_at", null)
      .then(
        ({ data }) => {
          const rows = (data as unknown as ClassRow[]) ?? [];
          const ordered = promotedIds.map((id) => rows.find((r) => r.id === id)).filter(Boolean) as ClassRow[];
          setPromoted(ordered.length > 0 ? ordered : [GOLDEN_CLASS]);
        },
        () => {
          setPromoted([GOLDEN_CLASS]);
        },
      );
  }, [promotedIds]);

  // Site settings copy (admin-editable). Prefers admin English, falls back to AI-translated Georgian.
  const heroTitle = useTranslated(copyEn.hero_title || copyKa.hero_title || t("home.heroTitle"));
  const heroSubtitle = useTranslated(copyEn.hero_subtitle || copyKa.hero_subtitle || t("home.heroSubtitle"));
  const schoolsTitle = useTranslated(copyEn.for_schools_title || copyKa.for_schools_title || t("home.forSchoolsTitle"));
  const schoolsSubtitle = useTranslated(copyEn.for_schools_subtitle || copyKa.for_schools_subtitle || t("home.forSchoolsSubtitle"));
  const translatedLocation = useTranslated(location);

  const heroGradient = activeView
    ? `linear-gradient(135deg, ${activeView.accent_hex}55 0%, ${activeView.accent_secondary_hex}66 100%)`
    : undefined;

  return (
    <AppShell hideHeader>
      <section
        className="relative overflow-hidden px-5 pb-3 pt-2 transition-[background] duration-500 md:rounded-3xl md:px-10 md:py-4 md:pt-5 md:pb-4 md:mt-4"
        style={heroGradient ? { background: heroGradient } : undefined}
      >
        <div className="flex items-center justify-between md:hidden">
          <Logo height={28} />
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="h-9 min-w-9 rounded-full bg-foreground/10 px-3 text-xs font-bold text-foreground backdrop-blur hover:bg-foreground/20" />
            <button
              onClick={() => navigate({ to: user ? (role === "school" ? "/school/dashboard" : "/profile") : "/auth" })}
              className="rounded-full bg-foreground/10 px-3.5 py-2 text-xs font-semibold text-foreground backdrop-blur transition hover:bg-foreground/20"
            >
              {user ? t("common.account") : t("common.signIn")}
            </button>
          </div>
        </div>
        <div className="mt-2 md:hidden">
          <ViewTabs variant="onHero" />
        </div>
        <div className="mt-4 animate-fade-up md:mt-0 md:grid md:grid-cols-2 md:gap-8 md:items-center">
          <div>
            <h1 className="text-2xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {heroTitle}
            </h1>
            <p className="mt-2 text-sm text-foreground/70 md:mt-3 md:text-base">{heroSubtitle}</p>

            <button
              onClick={() => navigate({ to: "/search" })}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left shadow-card transition hover:shadow-elevated md:py-3.5"
            >
              <Search className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm text-muted-foreground md:text-base">{t("home.searchPlaceholder")}</span>
            </button>

            <div className="mt-2 flex items-center justify-between rounded-2xl bg-surface/60 px-4 py-2 backdrop-blur">
              <div className="flex items-center gap-2 text-xs text-foreground/80 md:text-sm">
                <MapPin className="h-4 w-4 text-primary-strong" />
                <span className="font-medium">{translatedLocation}</span>
              </div>
              <button
                onClick={() => {
                  const next = window.prompt(t("home.locationPrompt"), location) ?? location;
                  setLocation(next);
                  window.localStorage.setItem("activoo:location", next);
                }}
                className="text-xs font-semibold text-primary-strong"
              >
                {t("common.change")}
              </button>
            </div>

            <button
              onClick={() => navigate({ to: "/match" })}
              className="mt-3 flex w-full items-center justify-between rounded-2xl bg-foreground px-4 py-3 text-background shadow-pop transition active:scale-[0.99] md:py-3.5"
            >
              <span className="flex items-center gap-2 text-sm font-bold md:text-base">
                <Sparkles className="h-4 w-4 text-accent-strong" />
                {t("home.smartMatchCTA")}
              </span>
              <span className="text-base">→</span>
            </button>
          </div>

          {/* Desktop hero illustration */}
          <div className="hidden md:flex md:items-center md:justify-center md:overflow-visible">
            <img
              src={heroIllustration}
              alt="Boy with backpack and soccer ball"
              width={800}
              height={1000}
              className="h-auto max-h-[360px] w-auto max-w-full scale-110 object-contain drop-shadow-xl translate-y-3 lg:max-h-[440px] lg:translate-y-4"
            />
          </div>
        </div>
      </section>

      <section className="pt-2 md:pt-4">
        <SectionHeader title={activeViewTitle} />
        <div className="scrollbar-hide flex gap-2.5 overflow-x-auto px-4 pb-2 md:flex-wrap md:overflow-visible md:px-0">
          {viewCats.map((c) => <CategoryChip key={c.id} cat={c} />)}
        </div>
      </section>

      {promoted && promoted.length > 0 && (
        <section>
          <SectionHeader
            title={lang === "en" ? "Recommended" : "რეკომენდებული"}
            subtitle={lang === "en" ? "Selected clubs from our partners" : "პარტნიორების რჩეული კლუბები"}
          />
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4">
            {promoted.map((c) => <ClassCard key={c.id} cls={c} variant="wide" />)}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title={t("home.popular")} subtitle={t("home.popularSubtitle")} href="/search" />
        {!featured ? <CardRowSkeleton wide /> : featured.length === 0 ? <EmptyRow text={t("home.empty")} /> : (
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4">
            {featured.map((c) => <ClassCard key={c.id} cls={c} variant="wide" />)}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={t("home.new")} subtitle={t("home.newSubtitle")} href="/search" />
        {!fresh ? <CardRowSkeleton /> : fresh.length === 0 ? <EmptyRow text={t("home.empty")} /> : (
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4">
            {fresh.map((c) => <ClassCard key={c.id} cls={c} />)}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title={lang === "en" ? "Most viewed" : "ყველაზე ნახვადი"}
          subtitle={lang === "en" ? "What other parents are looking at right now" : "რას ათვალიერებენ სხვა მშობლები ახლა"}
          href="/search"
        />
        {!mostViewed ? <CardRowSkeleton /> : mostViewed.length === 0 ? <EmptyRow text={t("home.empty")} /> : (
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4">
            {mostViewed.map((c) => <ClassCard key={c.id} cls={c} />)}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={t("home.nearby")} subtitle={`${t("home.nearbyAround")} ${translatedLocation}`} href="/search" />
        {!nearby ? <CardRowSkeleton /> : (
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4">
            {nearby.map((c) => <ClassCard key={c.id} cls={c} />)}
          </div>
        )}
      </section>

      <section className="mx-4 my-8 rounded-3xl bg-gradient-card p-5 shadow-card md:mx-0 md:p-8">
        <div className="grid grid-cols-3 gap-3 text-center md:gap-8">
          <Stat icon={<Sparkles className="h-5 w-5" />} value="100+" label={t("home.statsClasses")} />
          <Stat icon={<Users className="h-5 w-5" />} value="2,500+" label={t("home.statsParents")} />
          <Stat icon={<Star className="h-5 w-5" />} value="4.9★" label={t("home.statsRating")} />
        </div>
      </section>

      <section className="mx-4 mb-8 overflow-hidden rounded-3xl bg-foreground p-6 text-background shadow-elevated md:mx-0 md:flex md:items-center md:justify-between md:gap-8 md:p-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">{t("home.forSchoolsTag")}</p>
          <h3 className="mt-2 text-xl font-bold md:text-3xl">{schoolsTitle}</h3>
          <p className="mt-1 text-sm text-background/70 md:text-base">{schoolsSubtitle}</p>
        </div>
        <Link
          to="/school/onboarding"
          className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-full bg-accent-strong px-5 py-2.5 text-sm font-bold text-foreground transition hover:opacity-90 md:mt-0 md:px-7 md:py-3.5 md:text-base"
        >
          {t("home.becomePartner")}
        </Link>
      </section>
    </AppShell>
  );
}

const VIEW_NAMES_KA: Record<string, string> = {
  education: "განათლება",
  activity: "აქტივობა",
  masterclasses: "მასტერკლასები",
  services: "სერვისები",
  "განათლება": "განათლება",
  "აქტივობა": "აქტივობა",
  "მასტერკლასები": "მასტერკლასები",
  "სერვისები": "სერვისები",
};

const VIEW_NAMES_EN: Record<string, string> = {
  education: "Education",
  activity: "Activity",
  masterclasses: "Masterclasses",
  services: "Services",
  "განათლება": "Education",
  "აქტივობა": "Activity",
  "მასტერკლასები": "Masterclasses",
  "სერვისები": "Services",
};

const CATEGORY_NAMES_KA: Record<string, string> = {
  languages: "უცხო ენები",
  language: "უცხო ენები",
  school: "სასკოლო საგნები",
  "school subjects": "სასკოლო საგნები",
  school_subjects: "სასკოლო საგნები",
  it: "რობოტიკა და IT",
  "it & tech": "IT და კოდინგი",
  it_tech: "IT და კოდინგი",
  examprep: "გამოცდებისთვის მომზადება",
  "exam prep": "გამოცდებისთვის მომზადება",
  exam_prep: "გამოცდებისთვის მომზადება",
  softskills: "მენტალური უნარები",
  "soft skills": "მენტალური უნარები",
  soft_skills: "მენტალური უნარები",
  art: "ხელოვნება და ხატვა",
  "art & painting": "ხელოვნება და ხატვა",
  creativity: "შემოქმედება და ხელსაქმე",
  sports: "სპორტი და ფიტნესი",
  sport: "სპორტი და ფიტნესი",
  music: "მუსიკა და ვოკალი",
  dance: "ცეკვა და ქორეოგრაფია",
  cooking: "კულინარია და საკონდიტრო",
  pottery: "კერამიკა და თიხა",
  tutoring: "რეპეტიტორები და მომზადება",
  speech: "ლოგოპედი და ფსიქოლოგი",
  development: "განვითარება",
};

const CATEGORY_NAMES_EN: Record<string, string> = {
  languages: "Languages",
  language: "Languages",
  school: "School Subjects",
  "school subjects": "School Subjects",
  school_subjects: "School Subjects",
  it: "Robotics & IT",
  "it & tech": "IT & Tech",
  it_tech: "IT & Tech",
  examprep: "Exam Prep",
  "exam prep": "Exam Prep",
  exam_prep: "Exam Prep",
  softskills: "Soft Skills",
  "soft skills": "Soft Skills",
  soft_skills: "Soft Skills",
  art: "Art & Painting",
  "art & painting": "Art & Painting",
  creativity: "Creativity & Crafts",
  sports: "Sports & Fitness",
  sport: "Sports & Fitness",
  music: "Music & Vocal",
  dance: "Dance & Choreography",
  cooking: "Culinary & Pastry",
  pottery: "Ceramics & Pottery",
  tutoring: "Private Tutoring",
  speech: "Speech & Psychology",
  development: "Early Development",
};

function CategoryChip({ cat }: { cat: { id: string; slug: string; name: string; name_en?: string | null; icon: string; icon_url?: string | null } }) {
  const { lang } = useI18n();
  const slugKey = (cat.slug || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const nameKey = (cat.name || "").toLowerCase().trim();

  let displayName = cat.name;
  if (lang === "en") {
    displayName = cat.name_en || CATEGORY_NAMES_EN[nameKey] || CATEGORY_NAMES_EN[slugKey] || cat.name;
  } else {
    displayName = CATEGORY_NAMES_KA[nameKey] || CATEGORY_NAMES_KA[slugKey] || cat.name;
  }

  return (
    <Link
      to="/search"
      search={{ category: cat.slug } as never}
      className="group flex shrink-0 flex-col items-center gap-2 rounded-2xl bg-surface px-4 py-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card min-w-[90px]"
    >
      <CmsIcon url={cat.icon_url} emoji={cat.icon} className="h-7 w-7 text-2xl" />
      <span className="text-xs font-semibold text-foreground text-center line-clamp-2 max-w-[100px]">{displayName}</span>
    </Link>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/30 text-primary-strong">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div className="mx-4 rounded-2xl bg-surface-soft p-6 text-center text-sm text-muted-foreground">{text}</div>;
}
