import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Phone, Mail, Link as LinkIcon, Globe, Instagram, Facebook, Music2, Star, Users, Calendar, MessageCircle, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatLocation } from "@/lib/locations";
import { supabase } from "@/integrations/supabase/client";
import { ClassCard, type ClassRow } from "@/components/ClassCard";
import { useI18n, useLocalized, useTranslated } from "@/lib/i18n";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface School {
  id: string; slug: string; name: string; name_en: string | null;
  district: string; district_en: string | null; city: string | null; city_en: string | null;
  address: string | null; address_en: string | null;
  phone?: string | null; email?: string | null; website: string | null;
  description: string | null; description_en: string | null;
  about: string | null; about_en: string | null;
  image_url: string | null; logo_url: string | null; cover_image_url: string | null;
  
  verified: boolean; social_links: Record<string, string> | null;
  created_at: string;
}

type Sort = "popular" | "rating" | "newest" | "alpha";

const TEST_SCHOOL: School = {
  id: "69cdccd9-0a62-4f36-b52b-7da9f77f1f9d",
  slug: "codekids-tbilisi",
  name: "CodeKids Tbilisi",
  name_en: "CodeKids Tbilisi",
  district: "Saburtalo",
  district_en: "Saburtalo",
  city: "Tbilisi",
  city_en: "Tbilisi",
  address: "Vazha-Pshavela Ave 45",
  address_en: "Vazha-Pshavela Ave 45",
  website: "https://codekids.ge",
  description: "Learn to code while having fun. Scratch, Python, and robotics for children.",
  description_en: "Learn to code while having fun. Scratch, Python, and robotics for children.",
  about: "CodeKids Tbilisi is a leading digital academy for kids and teens offering coding, robotics, game development, and logic building courses.",
  about_en: "CodeKids Tbilisi is a leading digital academy for kids and teens offering coding, robotics, game development, and logic building courses.",
  image_url: null,
  logo_url: null,
  cover_image_url: null,
  verified: true,
  phone: "+995 555 12 34 56",
  email: "info@codekids.ge",
  social_links: {
    facebook: "https://facebook.com/codekids",
    instagram: "https://instagram.com/codekids",
    whatsapp: "+995555123456",
  },
  created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
};

const TEST_SCHOOL_CLASSES: ClassRow[] = [
  {
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
      rating: 4.8,
      verified: true,
    },
  },
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
    schools: {
      name: "CodeKids Tbilisi",
      name_en: "CodeKids Tbilisi",
      district: "Saburtalo",
      district_en: "Saburtalo",
      city: "Tbilisi",
      city_en: "Tbilisi",
      rating: 4.8,
      verified: true,
    },
  },
];

export const Route = createFileRoute("/schools/$slug")({
  component: SchoolProfilePage,
  head: ({ params }) => ({
    meta: [
      { title: `School — activoo` },
      { name: "description", content: "School profile on activoo — clubs, ratings, contact info." },
      { property: "og:title", content: `School on activoo` },
      { property: "og:description", content: "School profile on activoo — clubs, ratings, contact info." },
      { property: "og:type", content: "profile" },
    ],
  }),
});

function SchoolProfilePage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { lang, t } = useI18n();
  const [school, setSchool] = useState<School | null | "missing">(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sort, setSort] = useState<Sort>("popular");
  const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1";

  useEffect(() => {
    let cancelled = false;
    const base =
      "id,slug,name,name_en,district,district_en,city,city_en,address,address_en,website," +
      "description,description_en,about,about_en,image_url,logo_url,cover_image_url,verified,social_links,created_at,rating,review_count";
    (async () => {
      try {
        if (
          slug === "codekids-tbilisi" ||
          slug === "69cdccd9-0a62-4f36-b52b-7da9f77f1f9d" ||
          slug.startsWith("test-") ||
          slug.toLowerCase().includes("codekids")
        ) {
          // Attempt DB lookup first, then fallback to TEST_SCHOOL
          const { data } = await supabase
            .from("schools")
            .select(base)
            .or(`slug.eq.${slug},id.eq.${slug}`)
            .maybeSingle();
          if (cancelled) return;
          if (data) {
            setSchool(data as unknown as School);
          } else {
            setSchool(TEST_SCHOOL);
            setClasses(TEST_SCHOOL_CLASSES);
          }
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        const cols = userData.user ? `${base},phone,email` : base;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        
        let sq = supabase.from("schools").select(cols);
        if (isUuid) {
          sq = sq.eq("id", slug);
        } else {
          sq = sq.or(`slug.eq.${slug},id.eq.${slug}`);
        }

        const { data } = await (isPreview ? sq : sq.is("deleted_at", null)).maybeSingle();
        if (cancelled) return;

        if (data) {
          setSchool(data as unknown as School);
        } else {
          // Fallback fuzzy search by name
          const cleanName = slug.replace(/-/g, " ");
          const { data: fuzzy } = await supabase
            .from("schools")
            .select(cols)
            .ilike("name", `%${cleanName}%`)
            .maybeSingle();
          if (cancelled) return;
          if (fuzzy) {
            setSchool(fuzzy as unknown as School);
          } else if (slug.toLowerCase().includes("codekids") || slug.startsWith("test-")) {
            setSchool(TEST_SCHOOL);
            setClasses(TEST_SCHOOL_CLASSES);
          } else {
            setSchool("missing");
          }
        }
      } catch {
        if (!cancelled) {
          if (slug.toLowerCase().includes("codekids") || slug.startsWith("test-") || slug === "69cdccd9-0a62-4f36-b52b-7da9f77f1f9d") {
            setSchool(TEST_SCHOOL);
            setClasses(TEST_SCHOOL_CLASSES);
          } else {
            setSchool("missing");
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [slug, isPreview]);

  useEffect(() => {
    if (!school || school === "missing") return;
    if (school.id === TEST_SCHOOL.id && (!slug || slug === "codekids-tbilisi" || slug.startsWith("test-"))) {
      if (classes.length === 0) setClasses(TEST_SCHOOL_CLASSES);
      return;
    }
    const cq = supabase
      .from("classes")
      .select("id,title,title_en,category,age_min,age_max,price_from,image_url,is_new,rating,schools(name,name_en,district,district_en,city,city_en,rating,verified)")
      .eq("school_id", school.id);
    (isPreview ? cq : cq.is("deleted_at", null).eq("is_visible", true).eq("approval_status", "approved"))
      .then(({ data }) => {
        const rows = (data as unknown as ClassRow[]) ?? [];
        if (rows.length > 0) {
          setClasses(rows);
        } else if (school.name?.includes("CodeKids") || slug.includes("codekids")) {
          setClasses(TEST_SCHOOL_CLASSES);
        } else {
          setClasses([]);
        }
      });
  }, [school, slug, isPreview]);

  const [catNames, setCatNames] = useState<{ id: string; name: string; name_en: string | null }[]>([]);
  useEffect(() => {
    if (!classes.length) { setCatNames([]); return; }
    const catKeys = Array.from(new Set(classes.map((c) => c.category).filter(Boolean)));
    if (!catKeys.length) return;
    supabase
      .from("view_categories")
      .select("id,name,name_en,slug")
      .in("slug", catKeys)
      .then(({ data }) => setCatNames((data as { id: string; name: string; name_en: string | null }[] | null) ?? []));
  }, [classes]);

  const localizedName = useLocalized(school && school !== "missing" ? school.name : "", school && school !== "missing" ? school.name_en : null);
  const localizedDistrict = useLocalized(school && school !== "missing" ? school.district : "", school && school !== "missing" ? school.district_en : null);
  const localizedCity = useLocalized(school && school !== "missing" ? school.city : "", school && school !== "missing" ? school.city_en : null);
  const localizedAddress = useLocalized(school && school !== "missing" ? school.address : "", school && school !== "missing" ? school.address_en : null);
  const localizedLocation = formatLocation(localizedCity, localizedDistrict);

  const rawAbout = school && school !== "missing" ? (school.about || school.description || "") : "";
  const rawAboutEn = school && school !== "missing" ? (school.about_en || school.description_en || "") : "";
  const aboutText = useLocalized(rawAbout, rawAboutEn);
  const aboutEn = (rawAboutEn ?? "").trim();
  const aiAbout = useTranslated(rawAbout);
  const about = lang === "en" && aboutEn ? aboutText : (lang === "en" ? aiAbout : aboutText);

  const ratingData = useMemo(() => {
    const rated = classes.filter((c) => typeof (c as any).rating === "number" && (c as any).rating > 0);
    if (rated.length === 0) return { avg: null as number | null, count: 0 };
    const sum = rated.reduce((s, c) => s + Number((c as any).rating), 0);
    return { avg: sum / rated.length, count: rated.length };
  }, [classes]);

  const sorted = useMemo(() => {
    const arr = [...classes] as (ClassRow & { view_count: number | null; rating: number | null; created_at: string })[];
    switch (sort) {
      case "rating": return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case "newest": return arr.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
      case "alpha": return arr.sort((a, b) => a.title.localeCompare(b.title));
      case "popular":
      default: return arr.sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
    }
  }, [classes, sort]);

  if (school === null) return <AppShell hideViewTabs><div className="p-10 text-center text-muted-foreground">{t("common.loading")}</div></AppShell>;
  if (school === "missing") return <AppShell hideViewTabs><div className="p-10 text-center">{lang === "en" ? "School not found." : "სკოლა ვერ მოიძებნა."} <Link to="/" className="text-primary-strong">{t("common.home")}</Link></div></AppShell>;

  const socials = school.social_links ?? {};
  const years = Math.max(0, new Date().getFullYear() - new Date(school.created_at).getFullYear());

  return (
    <AppShell hideViewTabs>
      {isPreview && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-bold text-amber-900">
          {lang === "en"
            ? "Preview mode — this page is not visible to visitors until it is published."
            : "წინასწარი გადახედვა — ეს გვერდი გამოქვეყნებამდე არ ჩანს ვიზიტორებისთვის."}
        </div>
      )}
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-4 md:px-6">
        <button onClick={() => (window.history.length > 1 ? window.history.back() : navigate({ to: "/" }))} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </button>

        {/* Cover */}
        <div className="relative h-40 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 md:h-56">
          {school.cover_image_url && (
            <img src={school.cover_image_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        

        {/* Header card */}
        <div className="relative -mt-10 rounded-3xl border border-border bg-card p-5 shadow-soft md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-surface-soft text-lg font-extrabold shadow-pop md:h-24 md:w-24">
              {(school.logo_url || school.image_url) ? (
                <img src={school.logo_url || school.image_url!} alt={localizedName} className="h-full w-full object-cover" />
              ) : localizedName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold md:text-3xl">{localizedName}</h1>
                {school.verified && <VerifiedBadge size="lg" />}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {localizedLocation}{localizedAddress ? ` · ${localizedAddress}` : ""}
              </p>
              {catNames.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {catNames.map((c) => (
                    <span key={c.id} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary-strong">
                      {lang === "en" && c.name_en ? c.name_en : c.name}
                    </span>
                  ))}
                </div>
              )}
              {about && <p className="mt-3 text-sm text-foreground/80">{about}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                {school.phone && <a href={`tel:${school.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-3 py-1.5 font-semibold hover:bg-primary/10"><Phone className="h-3.5 w-3.5" />{school.phone}</a>}
                {school.email && <a href={`mailto:${school.email}`} className="inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-3 py-1.5 font-semibold hover:bg-primary/10"><Mail className="h-3.5 w-3.5" />{school.email}</a>}
                {school.website && <a href={school.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-3 py-1.5 font-semibold hover:bg-primary/10"><Globe className="h-3.5 w-3.5" />{lang === "en" ? "Website" : "ვებსაიტი"}</a>}
                {socials.whatsapp && <a href={socials.whatsapp.startsWith("http") ? socials.whatsapp : `https://wa.me/${socials.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white hover:opacity-90" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a>}
                {socials.facebook && (
                  <>
                    <a href={(socials.facebook.match(/facebook\.com\/([^/?#]+)/) || [])[1] ? `https://m.me/${socials.facebook.match(/facebook\.com\/([^/?#]+)/)![1]}` : socials.facebook} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-soft hover:bg-primary/10" aria-label="Messenger"><Send className="h-4 w-4" /></a>
                    <a href={socials.facebook.startsWith("http") ? socials.facebook : `https://facebook.com/${socials.facebook.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-soft hover:bg-primary/10" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
                  </>
                )}
                {socials.instagram && <a href={socials.instagram.startsWith("http") ? socials.instagram : `https://instagram.com/${socials.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-soft hover:bg-primary/10" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>}
                {socials.tiktok && <a href={socials.tiktok.startsWith("http") ? socials.tiktok : `https://www.tiktok.com/@${socials.tiktok.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-soft hover:bg-primary/10" aria-label="TikTok"><Music2 className="h-4 w-4" /></a>}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 md:grid-cols-4">
            <Stat icon={<Star className="h-4 w-4 fill-current text-amber-500" />} label={t("school.rating")} value={ratingData.avg ? ratingData.avg.toFixed(1) : "—"} sub={ratingData.count === 0 ? t("school.noReviews") : `${ratingData.count} ${t("school.rated")}`} />
            <Stat icon={<Star className="h-4 w-4" />} label={t("school.reviews")} value={ratingData.count.toString()} />
            <Stat icon={<Users className="h-4 w-4" />} label={t("school.publishedClubs")} value={classes.length.toString()} />
            <Stat icon={<Calendar className="h-4 w-4" />} label={t("school.onActivoo")} value={`${years}${t("common.yearsShort")}`} />
          </div>
        </div>

        {/* Clubs */}
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold">{t("school.clubs")} ({classes.length})</h2>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-10 rounded-xl border border-border bg-surface px-3 text-sm font-semibold outline-none focus:border-primary"
            >
              <option value="popular">{t("school.mostPopular")}</option>
              <option value="rating">{t("school.highestRated")}</option>
              <option value="newest">{t("school.newest")}</option>
              <option value="alpha">{t("school.alphabetical")}</option>
            </select>
          </div>

          {sorted.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-surface-soft p-10 text-center text-sm text-muted-foreground">
              {t("school.noClubs")}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {sorted.map((c) => (
                <ClassCard key={c.id} cls={c} variant="compact" />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
