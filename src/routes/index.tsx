import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, MapPin, Sparkles, Star, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClassCard, type ClassRow } from "@/components/ClassCard";
import { CardRowSkeleton } from "@/components/Skeletons";
import { SectionHeader } from "@/components/SectionHeader";
import { Logo } from "@/components/Logo";
import heroIllustration from "@/assets/hero-illustration.png";
import { useView, useViewCategories } from "@/lib/view-context";
import { ViewTabs } from "@/components/ViewTabs";
import { useT, useTranslated } from "@/lib/i18n";
// import { supabase } from "@/integrations/supabase/client"; // დროებით გათიშულია

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

// 🏆 ჩვენი "ოქროს კლასი" ტესტირებისთვის
const GOLDEN_CLASS: ClassRow = {
  id: "test-golden-class-001",
  title: "რობოტიკა და IT საფუძვლები",
  category: "it",
  age_min: 7,
  age_max: 12,
  price_from: 150,
  image_url: "coding", // გამოიძახებს ჩვენს ლოკალურ class-coding.jpg-ს
  is_new: true,
  schools: {
    name: "TechKids Academy",
    district: "Saburtalo",
    rating: 4.9,
  }
};

function HomePage() {
  const navigate = useNavigate();
  const t = useT();
  const { activeView } = useView();
  const viewCats = useViewCategories(activeView?.id);

  // State-ები მონაცემებისთვის
  const [featured, setFeatured] = useState<ClassRow[] | null>(null);
  const [fresh, setFresh] = useState<ClassRow[] | null>(null);
  const [nearby, setNearby] = useState<ClassRow[] | null>(null);
  const [location, setLocation] = useState("Tbilisi, Georgia");

  useEffect(() => {
    const loc = typeof window !== "undefined" ? window.localStorage.getItem("activoo:location") : null;
    if (loc) setLocation(loc);
  }, []);

  useEffect(() => {
    // მონაცემების "ჩატვირთვის" იმიტაცია მცირე დაყოვნებით, რომ სკელეტონიც გამოჩნდეს
    setFeatured(null);
    setFresh(null);
    setNearby(null);

    const timer = setTimeout(() => {
      // ვსვამთ მხოლოდ ერთ იდეალურ "ოქროს კლასს" ტესტირებისთვის
      setFeatured([GOLDEN_CLASS, GOLDEN_CLASS, GOLDEN_CLASS, GOLDEN_CLASS]); // 4 ცალს ვაჩვენებთ, რომ grid შეივსოს
      setFresh([GOLDEN_CLASS, GOLDEN_CLASS, GOLDEN_CLASS, GOLDEN_CLASS]);
      setNearby([GOLDEN_CLASS, GOLDEN_CLASS, GOLDEN_CLASS, GOLDEN_CLASS]);
    }, 800);

    return () => clearTimeout(timer);

    /*
    // ორიგინალი Supabase-ის ლოგიკა დროებით დავაკომენტარეთ
    const select = "id,title,category,age_min,age_max,price_from,image_url,is_new,schools(name,district,rating)";
    const base = () => {
      let q = supabase.from("classes").select(select).eq("is_visible", true);
      if (activeView?.id) q = q.eq("view_id", activeView.id);
      return q;
    };
    Promise.all([
      base().eq("is_featured", true).limit(8),
      base().eq("is_new", true).limit(8),
      base().order("created_at", { ascending: false }).limit(8),
    ]).then(([f, n, near]) => {
      setFeatured((f.data as unknown as ClassRow[]) ?? []);
      setFresh((n.data as unknown as ClassRow[]) ?? []);
      setNearby((near.data as unknown as ClassRow[]) ?? []);
    });
    */
  }, [activeView?.id]);

  const heroTitle = useTranslated(t("home.heroTitle"));
  const heroSubtitle = useTranslated(t("home.heroSubtitle"));
  const schoolsTitle = useTranslated(t("home.forSchoolsTitle"));
  const schoolsSubtitle = useTranslated(t("home.forSchoolsSubtitle"));
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
          <Logo height={27} />
          <button
            onClick={() => navigate({ to: "/auth" })}
            className="rounded-full bg-foreground/10 px-4 py-2 text-xs font-semibold text-foreground backdrop-blur transition hover:bg-foreground/20"
          >
            {t("common.signIn")}
          </button>
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

          <div className="hidden md:flex md:items-center md:justify-center md:overflow-visible">
            <img
              src={heroIllustration}
              alt="Hero Illustration"
              width={800}
              height={1000}
              className="h-auto max-h-[360px] w-auto max-w-full scale-110 object-contain drop-shadow-xl translate-y-3 lg:max-h-[440px] lg:translate-y-4"
            />
          </div>
        </div>
      </section>

      <section className="pt-2 md:pt-4">
        <SectionHeader title={activeView ? activeView.name : t("home.browseCategories")} />
        <div className="scrollbar-hide flex gap-2.5 overflow-x-auto px-4 pb-2 md:flex-wrap md:overflow-visible md:px-0">
          {viewCats.map((c) => <CategoryChip key={c.id} cat={c} />)}
        </div>
      </section>

      <section>
        <SectionHeader title={t("home.popular")} subtitle={t("home.popularSubtitle")} href="/search" />
        {!featured ? <CardRowSkeleton wide /> : featured.length === 0 ? <EmptyRow text={t("home.empty")} /> : (
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4">
            {featured.map((c, i) => <ClassCard key={`${c.id}-${i}`} cls={c} variant="wide" />)}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={t("home.new")} subtitle={t("home.newSubtitle")} href="/search" />
        {!fresh ? <CardRowSkeleton /> : fresh.length === 0 ? <EmptyRow text={t("home.empty")} /> : (
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4">
            {fresh.map((c, i) => <ClassCard key={`${c.id}-${i}`} cls={c} />)}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={t("home.nearby")} subtitle={`${t("home.nearbyAround")} ${translatedLocation}`} href="/search" />
        {!nearby ? <CardRowSkeleton /> : (
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4">
            {nearby.map((c, i) => <ClassCard key={`${c.id}-${i}`} cls={c} />)}
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

function CategoryChip({ cat }: { cat: { id: string; slug: string; name: string; icon: string } }) {
  return (
    <Link
      to="/search"
      search={{ category: cat.slug } as never}
      className="group flex shrink-0 flex-col items-center gap-2 rounded-2xl bg-surface px-4 py-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <span className="text-2xl">{cat.icon}</span>
      <span className="text-xs font-semibold text-foreground">{cat.name}</span>
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