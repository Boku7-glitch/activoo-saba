import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, MapPin, Sparkles, Star, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClassCard, type ClassRow } from "@/components/ClassCard";
import { CardRowSkeleton } from "@/components/Skeletons";
import { SectionHeader } from "@/components/SectionHeader";
import { Logo } from "@/components/Logo";
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";

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

function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<ClassRow[] | null>(null);
  const [fresh, setFresh] = useState<ClassRow[] | null>(null);
  const [nearby, setNearby] = useState<ClassRow[] | null>(null);
  const [location, setLocation] = useState("Tbilisi, Georgia");

  useEffect(() => {
    const loc = typeof window !== "undefined" ? window.localStorage.getItem("activoo:location") : null;
    if (loc) setLocation(loc);
  }, []);

  useEffect(() => {
    const select = "id,title,category,age_min,age_max,price_from,image_url,is_new,schools(name,district,rating)";
    Promise.all([
      supabase.from("classes").select(select).eq("is_featured", true).limit(8),
      supabase.from("classes").select(select).eq("is_new", true).limit(8),
      supabase.from("classes").select(select).order("created_at", { ascending: false }).limit(8),
    ]).then(([f, n, near]) => {
      setFeatured((f.data as unknown as ClassRow[]) ?? []);
      setFresh((n.data as unknown as ClassRow[]) ?? []);
      setNearby((near.data as unknown as ClassRow[]) ?? []);
    });
  }, []);

  return (
    <AppShell hideHeader>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero px-5 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <Logo height={36} />
          <button
            onClick={() => navigate({ to: "/auth" })}
            className="rounded-full bg-foreground/10 px-4 py-2 text-xs font-semibold text-foreground backdrop-blur transition hover:bg-foreground/20"
          >
            Sign in
          </button>
        </div>

        <div className="mt-7 animate-fade-up">
          <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-foreground">
            Find the perfect class for your child <span className="text-primary-strong">in 1 minute</span>
          </h1>
          <p className="mt-3 text-sm text-foreground/70">
            Dance, IT, sports, languages and more — near you, trusted by parents.
          </p>
        </div>

        <button
          onClick={() => navigate({ to: "/search" })}
          className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left shadow-card transition hover:shadow-elevated"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-sm text-muted-foreground">Search for a class or school</span>
        </button>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface/60 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2 text-xs text-foreground/80">
            <MapPin className="h-4 w-4 text-primary-strong" />
            <span className="font-medium">{location}</span>
          </div>
          <button
            onClick={() => {
              const next = window.prompt("Enter your area or city", location) ?? location;
              setLocation(next);
              window.localStorage.setItem("activoo:location", next);
            }}
            className="text-xs font-semibold text-primary-strong"
          >
            Change
          </button>
        </div>

        <button
          onClick={() => navigate({ to: "/match" })}
          className="mt-4 flex w-full items-center justify-between rounded-2xl bg-foreground px-4 py-3 text-background shadow-pop transition active:scale-[0.99]"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="h-4 w-4 text-accent-strong" />
            Smart Match — find a class in 60 seconds
          </span>
          <span className="text-base">→</span>
        </button>
      </section>

      {/* Categories */}
      <section className="pt-2">
        <SectionHeader title="Browse categories" />
        <div className="scrollbar-hide flex gap-2.5 overflow-x-auto px-4 pb-2">
          {CATEGORY_KEYS.map((key) => (
            <CategoryChip key={key} k={key} />
          ))}
        </div>
      </section>

      {/* Featured */}
      <section>
        <SectionHeader title="Popular classes" subtitle="Loved by parents this week" href="/search" />
        {!featured ? (
          <CardRowSkeleton wide />
        ) : featured.length === 0 ? (
          <EmptyRow text="No classes yet. Check back soon." />
        ) : (
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2">
            {featured.map((c) => (
              <ClassCard key={c.id} cls={c} variant="wide" />
            ))}
          </div>
        )}
      </section>

      {/* New */}
      <section>
        <SectionHeader title="New on activoo" subtitle="Fresh classes just added" href="/search" />
        {!fresh ? (
          <CardRowSkeleton />
        ) : fresh.length === 0 ? (
          <EmptyRow text="No new classes yet." />
        ) : (
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2">
            {fresh.map((c) => <ClassCard key={c.id} cls={c} />)}
          </div>
        )}
      </section>

      {/* Nearby */}
      <section>
        <SectionHeader title="Nearby" subtitle={`Around ${location}`} href="/search" />
        {!nearby ? (
          <CardRowSkeleton />
        ) : (
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2">
            {nearby.map((c) => <ClassCard key={c.id} cls={c} />)}
          </div>
        )}
      </section>

      {/* Trust */}
      <section className="mx-4 my-8 rounded-3xl bg-gradient-card p-5 shadow-card">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat icon={<Sparkles className="h-5 w-5" />} value="100+" label="Trusted classes" />
          <Stat icon={<Users className="h-5 w-5" />} value="2,500+" label="Happy parents" />
          <Stat icon={<Star className="h-5 w-5" />} value="4.9★" label="Avg. rating" />
        </div>
      </section>

      {/* For schools */}
      <section className="mx-4 mb-8 overflow-hidden rounded-3xl bg-foreground p-6 text-background shadow-elevated">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">For schools</p>
        <h3 className="mt-2 text-xl font-bold">Reach more parents in Tbilisi</h3>
        <p className="mt-1 text-sm text-background/70">List your classes for free and start receiving leads today.</p>
        <Link
          to="/school/onboarding"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent-strong px-5 py-2.5 text-sm font-bold text-foreground transition hover:opacity-90"
        >
          Become a partner →
        </Link>
      </section>
    </AppShell>
  );
}

function CategoryChip({ k }: { k: CategoryKey }) {
  const c = CATEGORIES[k];
  return (
    <Link
      to="/search"
      search={{ category: k } as never}
      className="group flex shrink-0 flex-col items-center gap-2 rounded-2xl bg-surface px-4 py-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <span className="text-2xl">{c.emoji}</span>
      <span className="text-xs font-semibold text-foreground">{c.label}</span>
    </Link>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/30 text-primary-strong">
        {icon}
      </div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="mx-4 rounded-2xl bg-surface-soft p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
