import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  Star,
  MapPin,
  Calendar,
  Users2,
  Mail,
  Clock,
  Link as LinkIcon,
  Instagram,
  Music2,
  Facebook,
  Check,
  ChevronRight,
  Send,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES, classImage, type CategoryKey } from "@/lib/categories";
import { formatLocation } from "@/lib/locations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { ClassLocationMap } from "@/components/ClassLocationMap";
import { ReviewsSection } from "@/components/ReviewsSection";
import { useI18n } from "@/lib/i18n";
import { VerifiedBadge } from "@/components/VerifiedBadge";

interface ContentBlock { title?: string; title_en?: string; text?: string; text_en?: string }

interface TeacherRow {
  id: string;
  first_name: string; last_name: string;
  first_name_en: string | null; last_name_en: string | null;
  bio: string | null; bio_en: string | null;
  photo_url: string | null; video_url: string | null;
  credentials: string[]; credentials_en: string[]; certificates: string[];
}

interface ScheduleRow {
  day: string;
  time?: string;
  from?: string;
  to?: string;
  group?: string;
  capacity?: number;
  taken?: number;
  note?: string;
}

interface ClassDetail {
  id: string;
  title: string;
  title_en: string | null;
  category: CategoryKey;
  category_ids?: string[] | null;
  subcategory_ids?: string[] | null;
  description: string | null;
  description_en: string | null;
  age_min: number;
  age_max: number;
  price_from: number;
  price_group?: number | null;
  price_individual?: number | null;
  formats?: string[] | null;
  format: "group" | "individual";
  language: string | null;
  lesson_duration_min: number | null;
  lessons_per_week: number | null;

  schedule: string | null;
  schedule_days: ScheduleRow[] | null;
  image_url: string | null;
  gallery: string[] | null;
  benefits: string[] | null;
  highlights: ContentBlock[] | null;
  syllabus: ContentBlock[] | null;
  extra_details: ContentBlock[] | null;
  reviews_enabled: boolean | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_facebook: string | null;
  contact_instagram: string | null;
  contact_tiktok: string | null;
  ask_enabled: boolean | null;
  open_lesson: string | null;
  open_lesson_en: string | null;
  free_lesson_slots: { date: string; time?: string | null; note?: string | null }[] | null;
  free_trial: boolean | null;
  free_trial_note: string | null;
  free_trial_note_en: string | null;
  rating: number | null;
  review_count: number | null;
  schools: {
    id: string; slug: string; name: string; name_en: string | null; district: string; district_en?: string | null; city?: string | null; city_en?: string | null; address: string | null; phone: string | null;
    email: string | null; website: string | null; working_hours: string | null;
    lat: number | null; lng: number | null;
    rating: number | null; review_count: number | null; description: string | null;
    logo_url: string | null; verified: boolean | null; social_links?: Record<string, string> | null;
  } | null;
}

export const Route = createFileRoute("/class/$id")({
  component: ClassDetailPage,
  head: () => ({
    meta: [
      { title: "Class — activoo" },
      { name: "description", content: "Explore class details, schedules, pricing, teachers, and book lessons on activoo." },
      { property: "og:title", content: "Class — activoo" },
      { property: "og:description", content: "Explore class details, schedules, pricing, teachers, and book lessons on activoo." },
      { property: "og:type", content: "website" },
    ],
  }),
});

const TEST_CLASS_DETAIL: ClassDetail = {
  id: "test-golden-class-001",
  title: "Scratch Coding Adventures & რობოტიკა",
  title_en: "Scratch Coding Adventures & Robotics",
  category: "it",
  description: "ისწავლეთ თამაშების და ანიმაციების შექმნა Scratch-ის გამოყენებით. საუკეთესო პირველი ნაბიჯი პროგრამირებაში.",
  description_en: "Learn to build games and animations using Scratch. The perfect first step into programming and robotics.",
  age_min: 7,
  age_max: 12,
  price_from: 80,
  price_group: 80,
  price_individual: 150,
  formats: ["group", "individual"],
  format: "group",
  language: "Georgian, English",
  lesson_duration_min: 60,
  lessons_per_week: 2,
  schedule: "ორშაბათი / ოთხშაბათი 17:30",
  schedule_days: [
    { day: "Mon", from: "17:30", to: "18:30", group: "Group A", capacity: 12, taken: 8, note: "Beginner level" },
    { day: "Wed", from: "17:30", to: "18:30", group: "Group A", capacity: 12, taken: 8, note: "Beginner level" },
    { day: "Sat", from: "12:00", to: "13:30", group: "Weekend Intensive", capacity: 10, taken: 4, note: "Project work" },
  ],
  image_url: null,
  gallery: [],
  benefits: ["1 ლეპტოპი თითოეულ ბავშვს", "საკუთარი პროექტების პორტფოლიო", "მშობლების შოუქეისი ყოველ თვე"],
  highlights: [
    { title: "ინდივიდუალური მიდგომა", text: "მცირე ჯგუფები და პერსონალური ყურადღება თითოეულ მოსწავლეს." },
    { title: "პრაქტიკული პროექტები", text: "თამაშების და აპლიკაციების რეალური შექმნა პირველივე გაკვეთილიდან." },
    { title: "მშობლების შოუქეისი", text: "ყოველთვიური პრეზენტაციები ბავშვების მიერ შექმნილი პროექტებით." },
  ],
  syllabus: [
    { title: "1-4 გაკვეთილი", text: "Scratch-ის ინტერფეისი, ანიმაციები, მოძრაობა და პირველი ინტერაქტიული თამაში." },
    { title: "5-8 გაკვეთილი", text: "ცვლადები, ლოგიკური პირობები (if/else) და რთული თამაშის მექანიკა." },
    { title: "9-12 გაკვეთილი", text: "რობოტიკის საფუძვლები და ფინალური პროექტის პრეზენტაცია." },
  ],
  extra_details: [
    { title: "საჭირო ინვენტარი", text: "ყველა საჭირო ტექნიკა და ლეპტოპი უზრუნველყოფილია აკადემიის მიერ." },
    { title: "სერტიფიკატი", text: "კურსის წარმატებით დასრულების შემდეგ გაიცემა ოფიციალური სერტიფიკატი." },
  ],
  reviews_enabled: true,
  contact_phone: "200 200",
  contact_whatsapp: "+995555000111",
  contact_facebook: "https://facebook.com",
  contact_instagram: "https://instagram.com",
  contact_tiktok: null,
  ask_enabled: true,
  open_lesson: "ღია გაკვეთილი გაიმართება ყოველ შაბათს",
  open_lesson_en: "Open free lesson held every Saturday",
  free_lesson_slots: [{ date: "2026-09-05", time: "12:00", note: "Free trial masterclass" }],
  free_trial: true,
  free_trial_note: "პირველი საცდელი გაკვეთილი უფასოა",
  free_trial_note_en: "First trial lesson is completely free",
  rating: 4.8,
  review_count: 96,
  schools: {
    id: "codekids-tbilisi",
    slug: "codekids-tbilisi",
    name: "CodeKids Tbilisi",
    name_en: "CodeKids Tbilisi",
    district: "Saburtalo",
    district_en: "Saburtalo",
    city: "Tbilisi",
    city_en: "Tbilisi",
    address: "კოსტავას ქ. 45",
    phone: "200 200",
    email: "info@codekids.ge",
    website: "https://codekids.ge",
    working_hours: "Mon - Sat: 10:00 - 19:00",
    lat: 41.7151,
    lng: 44.8271,
    rating: 4.9,
    review_count: 120,
    description: "Learn to code while having fun. Scratch, Python, and robotics for children.",
    logo_url: null,
    verified: true,
  },
};

const TEST_TEACHERS: TeacherRow[] = [
  {
    id: "teacher-1",
    first_name: "გიორგი",
    last_name: "ბერიძე",
    first_name_en: "Giorgi",
    last_name_en: "Beridze",
    bio: "IT & რობოტიკის წამყვანი მენტორი 7+ წლიანი გამოცდილებით.",
    bio_en: "Lead IT & Robotics mentor with 7+ years of experience.",
    photo_url: null,
    video_url: null,
    credentials: ["Bachelor's in Computer Science", "Certified Scratch & Python Educator"],
    credentials_en: ["Bachelor's in Computer Science", "Certified Scratch & Python Educator"],
    certificates: ["International STEM Educator 2025"],
  },
];

function ClassDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1";
  const { user } = useAuth();
  const [cls, setCls] = useState<ClassDetail | null | "missing">(null);
  const [saved, setSaved] = useState(false);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const { lang, t } = useI18n();
  const loc = (ka: string | null | undefined, en: string | null | undefined) =>
    (lang === "en" && (en ?? "").trim() ? (en as string) : (ka ?? ""));

  useEffect(() => {
    supabase.rpc("increment_class_view", { _class_id: id });
  }, [id]);

  const [tagCats, setTagCats] = useState<{ slug: string; name: string; name_en: string | null; kind: "category" | "subcategory" }[]>([]);

  useEffect(() => {
    const c = typeof cls === "object" && cls ? cls : null;
    const catIds = c?.category_ids ?? [];
    const subIds = c?.subcategory_ids ?? [];
    if (catIds.length === 0 && subIds.length === 0) { setTagCats([]); return; }
    Promise.all([
      catIds.length
        ? supabase.from("view_categories").select("slug,name,name_en").in("id", catIds)
        : Promise.resolve({ data: [] as never[] }),
      subIds.length
        ? supabase.from("view_subcategories").select("slug,name,name_en").in("id", subIds)
        : Promise.resolve({ data: [] as never[] }),
    ]).then(([a, b]) => {
      setTagCats([
        ...((a.data as { slug: string; name: string; name_en: string | null }[] | null) ?? []).map((r) => ({ ...r, kind: "category" as const })),
        ...((b.data as { slug: string; name: string; name_en: string | null }[] | null) ?? []).map((r) => ({ ...r, kind: "subcategory" as const })),
      ]);
    });
  }, [cls]);

  useEffect(() => {
    if (id.startsWith("test-") || id === "69cdccd9-0") {
      setCls(TEST_CLASS_DETAIL);
      setTeachers(TEST_TEACHERS);
      return;
    }

    supabase.from("class_teachers").select("*").eq("class_id", id).order("sort_order")
      .then(({ data }) => setTeachers((data as unknown as TeacherRow[]) ?? []));

    const schoolCols = user
      ? "id,slug,name,name_en,district,district_en,city,city_en,address,phone,email,website,working_hours,lat,lng,rating,review_count,description,logo_url,verified,social_links"
      : "id,slug,name,name_en,district,district_en,city,city_en,address,website,working_hours,lat,lng,rating,review_count,description,logo_url,verified,social_links";
    const q = supabase
      .from("classes")
      .select(`id,title,title_en,category,category_ids,subcategory_ids,description,description_en,age_min,age_max,price_from,price_group,price_individual,formats,format,language,lesson_duration_min,lessons_per_week,schedule,schedule_days,image_url,gallery,benefits,highlights,syllabus,extra_details,reviews_enabled,contact_phone,contact_whatsapp,contact_facebook,contact_instagram,contact_tiktok,ask_enabled,open_lesson,open_lesson_en,free_lesson_slots,free_trial,free_trial_note,free_trial_note_en,rating,review_count,schools(${schoolCols})`)
      .eq("id", id);
    (isPreview ? q : q.is("deleted_at", null).eq("approval_status", "approved"))
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCls(data as unknown as ClassDetail);
        } else {
          setCls(id.startsWith("test-") ? TEST_CLASS_DETAIL : "missing");
          if (id.startsWith("test-")) setTeachers(TEST_TEACHERS);
        }
      });

    if (user) {
      supabase.from("viewed_classes").insert({ user_id: user.id, class_id: id });
    }
  }, [id, user, isPreview]);

  useEffect(() => {
    if (!user) return;
    supabase.from("saved_classes").select("id").eq("user_id", user.id).eq("class_id", id).maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [user, id]);

  const toggleSave = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (saved) {
      await supabase.from("saved_classes").delete().eq("user_id", user.id).eq("class_id", id);
      setSaved(false);
      toast.success(lang === "en" ? "Removed from saved" : "წაიშალა შენახულებიდან");
    } else {
      const { error } = await supabase.from("saved_classes").insert({ user_id: user.id, class_id: id });
      if (!error) { setSaved(true); toast.success(lang === "en" ? "Saved to favorites" : "შენახულია რჩეულებში"); }
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: typeof cls === "object" && cls ? loc(cls.title, cls.title_en) : "", url });
      else { await navigator.clipboard.writeText(url); toast.success(t("common.linkCopied")); }
    } catch { /* noop */ }
  };

  if (cls === null) {
    return (
      <AppShell hideTabBar>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="aspect-[16/7] w-full animate-pulse rounded-3xl bg-muted" />
          <div className="mt-6 h-6 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </AppShell>
    );
  }

  if (cls === "missing") {
    return (
      <AppShell hideTabBar>
        <div className="p-8 text-center">
          <p className="text-3xl">🤷</p>
          <h1 className="mt-3 text-xl font-bold">{lang === "en" ? "Class not found" : "წრე ვერ მოიძებნა"}</h1>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary-strong">{t("common.backHome")}</Link>
        </div>
      </AppShell>
    );
  }

  const cat = CATEGORIES[cls.category] ?? CATEGORIES.it;
  const heroImg = classImage(cls.category, cls.image_url);
  const gallery = (cls.gallery && cls.gallery.length > 0 ? cls.gallery : []).slice(0, 4);
  // Fill remaining tiles with hero to keep the 1-big + 4-small layout consistent.
  while (gallery.length < 4) gallery.push(heroImg);
  const totalPhotos = 1 + (cls.gallery?.length ?? 0);
  const blocks = (v: unknown): ContentBlock[] => (Array.isArray(v) ? (v as ContentBlock[]) : []);
  const highlights = blocks(cls.highlights);
  const syllabus = blocks(cls.syllabus);
  const extraDetails = blocks(cls.extra_details);

  return (
    <AppShell hideTabBar hideViewTabs>
      {isPreview && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-bold text-amber-900">
          {lang === "en"
            ? "Preview mode — this page is not visible to visitors until it is published."
            : "წინასწარი გადახედვა — ეს გვერდი გამოქვეყნებამდე არ ჩანს ვიზიტორებისთვის."}
        </div>
      )}
      <div className="mx-auto w-full max-w-6xl px-3 pb-32 pt-3 md:px-6 md:pt-6">
        {/* Back button */}
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: "/search" })}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </button>

        {/* Gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:h-[420px] md:gap-3">
          <div className="col-span-4 row-span-2 h-56 overflow-hidden rounded-xl bg-muted md:col-span-2 md:h-auto md:rounded-2xl">
            <img src={heroImg} alt={cls.title} className="h-full w-full object-cover" />
          </div>
          {gallery.map((g, i) => (
            <div
              key={i}
              className={`relative hidden overflow-hidden rounded-xl bg-muted md:block md:rounded-2xl ${i === 3 ? "" : ""}`}
            >
              <img src={g} alt="" className="h-full w-full object-cover" />
              {i === 3 && (
                <button className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                  {lang === "en" ? `All photos · ${totalPhotos}` : `ყველა ფოტო · ${totalPhotos}`}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Tag row + meta */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-emerald-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              ONLINE
            </span>
            <span className="rounded-md bg-surface-soft px-2.5 py-1 text-xs font-semibold">
              {cat.emoji} {t(cat.labelKey)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>👁 1,679</span>
            <span>ID {cls.id.slice(0, 10)}</span>
          </div>
        </div>

        {/* Title + actions */}
        <div className="mt-3 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">{loc(cls.title, cls.title_en)}</h1>
          <div className="flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
            <button onClick={toggleSave} className="flex items-center gap-1.5 hover:text-foreground">
              <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : ""}`} />
              <span className="hidden sm:inline">{t("common.save")}</span>
            </button>
            <button onClick={share} className="flex items-center gap-1.5 hover:text-foreground">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t("common.share")}</span>
            </button>
          </div>
        </div>

        {/* Location strip */}
        {cls.schools && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {formatLocation(loc(cls.schools.city, cls.schools.city_en), loc(cls.schools.district, cls.schools.district_en))}</span>
            {loc(cls.schools.address, cls.schools.address) && <span>{loc(cls.schools.address, cls.schools.address)}</span>}
            {cls.schools.lat && cls.schools.lng && (
              <a href={`https://maps.google.com/?q=${cls.schools.lat},${cls.schools.lng}`} target="_blank" rel="noreferrer" className="font-semibold text-primary-strong hover:underline">
                {t("common.viewOnMap")}
              </a>
            )}
          </div>
        )}

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* LEFT: content */}
          <div className="space-y-8 md:col-span-2">
            {/* School / rating card */}
            {cls.schools && (
              <Link
                to="/schools/$slug"
                params={{ slug: cls.schools.slug || "codekids-tbilisi" }}
                className="group block rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/50 hover:bg-surface-soft/60 hover:shadow-md"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-soft text-xs font-bold text-muted-foreground transition group-hover:scale-105">
                      {cls.schools.logo_url ? (
                        <img src={cls.schools.logo_url} alt={cls.schools.name} className="h-full w-full object-cover" />
                      ) : (cls.schools.name?.slice(0, 2) ?? "Co")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground transition group-hover:text-primary group-hover:underline">
                        {loc(cls.schools.name, cls.schools.name_en)}
                        {cls.schools.verified && <VerifiedBadge size="md" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{cls.schools.description ?? "View school profile"}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-6 border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                    <div className="text-center">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{lang === "en" ? "Course rating" : "კლუბის რეიტინგი"}</div>
                      <div className="mt-0.5 text-xl font-extrabold text-foreground">{(cls.rating ?? 0) > 0 ? Number(cls.rating).toFixed(1) : "4.8"}</div>
                      <div className="mt-0.5 flex justify-center text-amber-500">
                        {[0,1,2,3,4].map(i => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.round(cls.rating || 5) ? "fill-current" : "fill-none text-muted-foreground/40"}`} />
                        ))}
                      </div>
                    </div>
                    <div className="text-center sm:border-l sm:border-border sm:pl-6">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("common.reviews")}</div>
                      <div className="mt-0.5 text-xl font-extrabold text-foreground">{cls.review_count ?? 96}</div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <div>
                <SectionHeading title={t("class.highlights")} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {highlights.map((b, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-surface-soft p-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-foreground">★</span>
                      <div>
                        {loc(b.title, b.title_en) && <div className="text-sm font-bold">{loc(b.title, b.title_en)}</div>}
                        {loc(b.text, b.text_en) && <div className="text-xs text-muted-foreground">{loc(b.text, b.text_en)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {loc(cls.description, cls.description_en) && (
              <div>
                <SectionHeading title={t("class.description")} />
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{loc(cls.description, cls.description_en)}</p>
              </div>
            )}

            {/* Schedule & groups */}
            {(() => {
              const rows = (cls.schedule_days ?? []).filter(
                (r) =>
                  (r?.day && String(r.day).trim()) ||
                  (r?.time && String(r.time).trim()) ||
                  (r?.from && String(r.from).trim()) ||
                  (r?.to && String(r.to).trim()) ||
                  Number(r?.capacity ?? 0) > 0,
              );
              if (rows.length === 0) return null;
              return (
              <div>
                <SectionHeading title={t("class.schedule")} />
                <div className="overflow-hidden rounded-2xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-soft text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">{t("class.groupCol")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("class.dayCol")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("class.timeCol")}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t("class.seatsCol")}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t("class.freeCol")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => {

                        const time = r.from || r.to ? `${r.from ?? ""}${r.to ? `–${r.to}` : ""}` : (r.time ?? "—");
                        const cap = Number(r.capacity ?? 0);
                        const free = cap ? Math.max(0, cap - Number(r.taken ?? 0)) : null;
                        return (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-2 font-semibold">{r.group || `${t("class.groupCol")} ${i + 1}`}</td>
                            <td className="px-3 py-2">{r.day}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{time}</td>
                            <td className="px-3 py-2 text-right">{cap || "—"}</td>
                            <td className="px-3 py-2 text-right">
                              {free === null ? "—" : (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${free > 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>{free}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              );
            })()}


            {/* Achievements */}
            {cls.benefits && cls.benefits.length > 0 && (
              <div>
                <SectionHeading title={t("class.benefits")} />
                <ul className="space-y-2">
                  {cls.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold">
                        <Check className="h-3 w-3" />
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Map & School Location */}
            {cls.schools && (
              <div>
                <SectionHeading title={t("class.mapLocation")} />
                <div className="overflow-hidden rounded-3xl border border-border/60 shadow-soft">
                  <div className="h-64 w-full">
                    <ClassLocationMap
                      location={{
                        providerId: cls.schools.slug || cls.schools.id,
                        lat: cls.schools.lat ?? 41.7151,
                        lng: cls.schools.lng ?? 44.8271,
                        title: loc(cls.schools.name, cls.schools.name_en),
                        address: loc(cls.schools.address, cls.schools.address) || loc(cls.schools.district, cls.schools.district_en),
                        price: cls.price_from,
                      }}
                      className="h-full w-full"
                    />
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-surface-soft p-4 text-sm">
                  <Link to="/schools/$slug" params={{ slug: cls.schools.slug || cls.schools.id || "codekids-tbilisi" }} className="text-base font-bold text-foreground hover:underline">
                    {loc(cls.schools.name, cls.schools.name_en)}
                  </Link>
                  <p className="mt-0.5 text-muted-foreground">{cls.schools.address ?? formatLocation(loc(cls.schools.city, cls.schools.city_en), loc(cls.schools.district, cls.schools.district_en))}</p>
                  {cls.schools.working_hours && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {cls.schools.working_hours}</p>
                  )}
                  {cls.schools.email && (
                    <a href={`mailto:${cls.schools.email}`} className="mt-1 flex items-center gap-1.5 text-xs text-primary-strong"><Mail className="h-3.5 w-3.5" /> {cls.schools.email}</a>
                  )}
                  {cls.schools.website && (
                    <a href={cls.schools.website} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 text-xs text-primary-strong"><LinkIcon className="h-3.5 w-3.5" /> {cls.schools.website}</a>
                  )}
                </div>
              </div>
            )}

            {/* Syllabus */}
            {syllabus.length > 0 && (
              <div>
                <SectionHeading title={t("class.syllabus")} />
                <div className="space-y-3">
                  {syllabus.map((b, i) => (
                    <div key={i} className="rounded-2xl border border-border p-4">
                      <div className="text-sm font-bold">{loc(b.title, b.title_en) || `${i + 1} ${t("class.lesson")}`}</div>
                      {loc(b.text, b.text_en) && (
                        <p className="mt-1 whitespace-pre-line text-sm text-foreground/80">{loc(b.text, b.text_en)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional details */}
            {extraDetails.length > 0 && (
              <div>
                <SectionHeading title={t("class.extraDetails")} />
                <div className="space-y-2">
                  {extraDetails.map((b, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-surface-soft p-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold">★</span>
                      <div className="text-sm">
                        {loc(b.title, b.title_en) && <span className="font-bold">{loc(b.title, b.title_en)} </span>}
                        <span className="whitespace-pre-line text-foreground/80">{loc(b.text, b.text_en)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teachers */}
            {teachers.length > 0 && (
              <div>
                <SectionHeading title={t("class.teachers")} />
                <div className="space-y-3">
                  {teachers.map((tRow) => {
                    const name = `${loc(tRow.first_name, tRow.first_name_en)} ${loc(tRow.last_name, tRow.last_name_en)}`.trim();
                    const creds = ((lang === "en" ? tRow.credentials_en : tRow.credentials) ?? []);
                    const list = creds.length ? creds : (tRow.credentials ?? []);
                    return (
                      <div key={tRow.id} className="grid grid-cols-1 gap-3 rounded-2xl border border-border p-4 md:grid-cols-[1fr_auto]">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-soft">
                              {tRow.photo_url && <img src={tRow.photo_url} alt={name} className="h-full w-full object-cover" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold">{name || "—"}</div>
                              {loc(tRow.bio, tRow.bio_en) && <div className="text-xs text-muted-foreground">{loc(tRow.bio, tRow.bio_en)}</div>}
                            </div>
                          </div>
                          {list.length > 0 && (
                            <ul className="space-y-1.5 text-xs">
                              {list.map((c, i) => (
                                <li key={i} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" /> {c}</li>
                              ))}
                            </ul>
                          )}
                          {tRow.certificates?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {tRow.certificates.map((c, i) => (
                                <a key={i} href={c} target="_blank" rel="noreferrer" className="h-16 w-16 overflow-hidden rounded-lg border border-border">
                                  <img src={c} alt="Certificate" className="h-full w-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        {tRow.video_url && (
                          <div className="h-40 w-full overflow-hidden rounded-xl bg-muted md:h-full md:w-56">
                            <video src={tRow.video_url} controls className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews */}
            <ReviewsSection classId={cls.id} schoolId={cls.schools?.id ?? null} enabled={cls.reviews_enabled !== false} />
          </div>

          {/* RIGHT: sidebar */}
          <aside className="space-y-4 md:col-span-1">
            {/* Pricing card */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">{cls.format === "group" ? t("class.groupClass") : t("class.individualClass")}</div>
                  <div className="text-[11px] text-muted-foreground">{t("class.classType")}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-surface-soft p-3 text-xs">
                <div>
                  <div className="text-sm font-extrabold">{cls.age_min}-{cls.age_max}</div>
                  <div className="text-[10px] text-muted-foreground">{t("common.age")}</div>
                </div>
                {(cls.lesson_duration_min || cls.lessons_per_week) && (
                  <>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <div className="text-sm font-extrabold">
                        {[
                          cls.lessons_per_week ? `${cls.lessons_per_week}${t("class.perWeek")}` : null,
                          cls.lesson_duration_min ? `${cls.lesson_duration_min} ${t("class.min")}` : null,
                        ].filter(Boolean).join(" · ")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{t("class.period")}</div>
                    </div>
                  </>
                )}
              </div>

              {(() => {
                const langs = (cls.language ?? "").split(",").map((s) => s.trim()).filter(Boolean);
                if (langs.length === 0) return null;
                return (
                  <div className="mt-3">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("class.language")}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {langs.map((l) => (
                        <span key={l} className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold">{l}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div className="mt-4">
                {cls.price_group == null && cls.price_individual == null ? (
                  <div className="text-3xl font-extrabold">
                    {cls.price_from} <span className="text-lg">ლ</span>
                    <span className="text-sm font-medium text-muted-foreground"> {t("common.perMonth")}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cls.price_group != null && (
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("common.group")}</span>
                        <span className="text-2xl font-extrabold">
                          {cls.price_group} <span className="text-base">ლ</span>
                          <span className="text-xs font-medium text-muted-foreground"> {t("common.perMonth")}</span>
                        </span>
                      </div>
                    )}
                    {cls.price_individual != null && (
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("common.individual")}</span>
                        <span className="text-2xl font-extrabold">
                          {cls.price_individual} <span className="text-base">ლ</span>
                          <span className="text-xs font-medium text-muted-foreground"> {t("common.perMonth")}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {(() => {
                const sl = cls.schools?.social_links ?? {};
                const phone = cls.contact_phone || cls.schools?.phone || "";
                const wa = cls.contact_whatsapp || sl.whatsapp || "";
                const fb = cls.contact_facebook || sl.facebook || "";
                const ig = cls.contact_instagram || sl.instagram || "";
                const tt = cls.contact_tiktok || sl.tiktok || "";
                const ttHref = tt.startsWith("http") ? tt : `https://www.tiktok.com/@${tt.replace(/^@/, "")}`;
                const waHref = wa.startsWith("http") ? wa : `https://wa.me/${wa.replace(/[^\d]/g, "")}`;
                const fbHref = fb.startsWith("http") ? fb : `https://facebook.com/${fb.replace(/^@/, "")}`;
                const igHref = ig.startsWith("http") ? ig : `https://instagram.com/${ig.replace(/^@/, "")}`;
                const fbUser = (fbHref.match(/facebook\.com\/([^/?#]+)/) || [])[1];
                const meHref = fbUser && fbUser !== "profile.php" ? `https://m.me/${fbUser}` : fbHref;
                const telHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
                return (
                  <div className="mt-4 flex items-center gap-2">
                    {phone && (
                      <a href={telHref} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground">
                        <Phone className="h-4 w-4" /> {phone.slice(-8)}
                      </a>
                    )}
                    {fb && <a href={meHref} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-soft" aria-label="Messenger"><Send className="h-4 w-4" /></a>}
                    {fb && <a href={fbHref} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-soft" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>}
                    {ig && <a href={igHref} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-soft" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>}
                    {tt && <a href={ttHref} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-soft" aria-label="TikTok"><Music2 className="h-4 w-4" /></a>}
                    {wa && <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a>}
                  </div>
                );
              })()}
              {cls.ask_enabled !== false && (
                <Link
                  to="/book/$id"
                  params={{ id: cls.id }}
                  className="mt-3 flex items-center justify-center rounded-xl border border-border py-2.5 text-sm font-bold hover:bg-surface-soft"
                >
                  {t("class.askQuestion")}
                </Link>
              )}
              {(() => {
                const slots = Array.isArray(cls.free_lesson_slots) ? cls.free_lesson_slots : [];
                const now = new Date();
                const upcoming = slots
                  .filter((s) => s && s.date)
                  .map((s) => ({ ...s, at: new Date(`${s.date}T${s.time || "00:00"}`) }))
                  .filter((s) => !Number.isNaN(s.at.getTime()) && s.at.getTime() >= now.getTime() - 2 * 60 * 60 * 1000)
                  .sort((a, b) => a.at.getTime() - b.at.getTime());
                const next = upcoming[0];
                const showBlock = cls.free_trial || next;
                if (!showBlock) return null;
                return (
                  <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                    <div className="font-bold">
                      {loc(cls.free_trial_note, cls.free_trial_note_en) || t("class.freeTrialAvailable")}
                    </div>
                    {next && (
                      <div className="mt-1.5 flex items-center gap-1.5 font-semibold">
                        <Calendar className="h-3.5 w-3.5" />
                        {next.at.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                        {next.time ? ` · ${next.time}` : ""}
                      </div>
                    )}
                    {next?.note && <div className="mt-1 opacity-80">{next.note}</div>}
                    {upcoming.length > 1 && (
                      <div className="mt-1 opacity-70">
                        +{upcoming.length - 1} {lang === "en" ? "more upcoming free lessons" : "მეტი უფასო გაკვეთილი"}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>


            {/* Tags */}
            <div>
              <SectionHeading title={t("class.tags")} />
              <div className="flex flex-wrap gap-2">
                {tagCats.map((tItem) => (
                  <Link
                    key={`${tItem.kind}-${tItem.slug}`}
                    to="/search"
                    search={tItem.kind === "category" ? { category: tItem.slug } : { subcategory: tItem.slug }}
                    className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold transition hover:bg-primary/20"
                  >
                    {loc(tItem.name, tItem.name_en)}
                  </Link>
                ))}
                {cls.schools?.district && (
                  <Link
                    to="/search"
                    search={{ district: cls.schools.district, city: cls.schools.city ?? undefined }}
                    className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold transition hover:bg-primary/20"
                  >
                    {loc(cls.schools.district, cls.schools.district_en)}
                  </Link>
                )}
                {tagCats.length === 0 && !cls.schools?.district && (
                  <Link to="/search" search={{ q: t(cat.labelKey) }} className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold transition hover:bg-primary/20">
                    {t(cat.labelKey)}
                  </Link>
                )}
              </div>
            </div>

            {/* Calendar */}
            {(() => {
              const rows = (cls.schedule_days ?? []).filter(
                (r) => (r?.day && String(r.day).trim()) || (r?.from && String(r.from).trim()) || (r?.time && String(r.time).trim()),
              );
              if (rows.length === 0) return null;
              return (
                <div>
                  <SectionHeading title={t("class.calendar")} />
                  <div className="space-y-2 rounded-2xl border border-border p-3">
                    {rows.map((r, i) => {
                      const time = r.from || r.to ? `${r.from ?? ""}${r.to ? ` · ${r.to}` : ""}` : (r.time ?? "");
                      const cap = Number(r.capacity ?? 0);
                      const free = cap ? Math.max(0, cap - Number(r.taken ?? 0)) : null;
                      return (
                        <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-surface-soft px-3 py-2 text-xs">
                          <div className="min-w-0">
                            <div className="truncate font-bold">{r.day}</div>
                            {time && <div className="text-[10px] text-muted-foreground">{time}</div>}
                            {r.note && <div className="truncate text-[10px] text-muted-foreground">{r.note}</div>}
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="font-bold">{cap ? `${cap} ${t("class.seats")}` : (r.group || "—")}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {r.group ? r.group : ""}
                              {free !== null ? `${r.group ? " · " : ""}${free} ${t("class.free")}` : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </aside>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          {cls.schools?.phone && (
            <a href={`tel:${cls.schools.phone}`} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft text-foreground shadow-soft" aria-label="Call">
              <Phone className="h-5 w-5" />
            </a>
          )}
          {cls.schools?.phone && (
            <a href={`sms:${cls.schools.phone}`} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft text-foreground shadow-soft" aria-label="Message">
              <MessageCircle className="h-5 w-5" />
            </a>
          )}
          <Link
            to="/book/$id"
            params={{ id: cls.id }}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop active:scale-[0.99]"
          >
            {t("common.sendRequest")}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-3">
      <div className="mb-2 h-1 w-8 rounded-full bg-amber-400" />
      <h2 className="text-lg font-extrabold">{title}</h2>
    </div>
  );
}
