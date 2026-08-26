import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES, AGE_BUCKETS, PRICE_BUCKETS, CATEGORY_KEYS, type CategoryKey } from "@/lib/categories";
import { ClassCard, type ClassRow } from "@/components/ClassCard";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/match")({
  component: MatchPage,
  head: () => ({ meta: [{ title: "Smart Match — activoo" }] }),
});

type Step = 0 | 1 | 2 | 3;

function MatchPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [age, setAge] = useState<typeof AGE_BUCKETS[number] | null>(null);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [budget, setBudget] = useState<typeof PRICE_BUCKETS[number] | null>(null);
  const [results, setResults] = useState<ClassRow[] | null>(null);

  const next = async () => {
    if (step < 2) setStep((s) => (s + 1) as Step);
    else {
      // run match
      setStep(3);
      let q = supabase
        .from("classes")
        .select("id,title,category,age_min,age_max,price_from,image_url,is_new,schools(name,district,rating)")
        .limit(20);
      if (age) q = q.lte("age_min", age.max).gte("age_max", age.min);
      if (category) q = q.eq("category", category);
      if (budget) q = q.gte("price_from", budget.min).lte("price_from", budget.max);
      const { data } = await q;
      setResults((data as unknown as ClassRow[]) ?? []);
    }
  };

  return (
    <AppShell hideTabBar hideHeader>
      <div className="flex items-center gap-3 bg-background px-4 py-3">
        <button
          onClick={() => (step === 0 ? navigate({ to: "/" }) : setStep((s) => (s - 1) as Step))}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-foreground" : "bg-muted")} />
          ))}
        </div>
      </div>

      <div className="px-5 pb-32 pt-2">
        {step === 0 && (
          <Step
            title="How old is your child?"
            subtitle="We'll match age-appropriate classes."
            options={AGE_BUCKETS.map((b) => ({
              key: b.label, label: b.label + " years", emoji: "🎂", active: age?.label === b.label, onClick: () => setAge(b),
            }))}
          />
        )}
        {step === 1 && (
          <Step
            title="What are they into?"
            subtitle="Pick a category to start exploring."
            options={CATEGORY_KEYS.map((k) => ({
              key: k, label: CATEGORIES[k].label, emoji: CATEGORIES[k].emoji,
              active: category === k, onClick: () => setCategory(k),
            }))}
          />
        )}
        {step === 2 && (
          <Step
            title="What's your monthly budget?"
            subtitle="We'll show classes in your range."
            options={PRICE_BUCKETS.map((b) => ({
              key: b.label, label: b.label, emoji: "💸",
              active: budget?.label === b.label, onClick: () => setBudget(b),
            }))}
          />
        )}
        {step === 3 && (
          <div>
            <div className="rounded-3xl bg-gradient-hero p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/70">
                <Sparkles className="h-4 w-4" /> Smart match
              </div>
              <h2 className="mt-2 text-2xl font-extrabold">{results?.length ?? "..."} classes for you</h2>
              <p className="mt-1 text-sm text-foreground/70">
                {age?.label} years • {category ? CATEGORIES[category].label : "Any"} • {budget?.label}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {results?.length === 0 ? (
                <div className="col-span-2 rounded-2xl bg-surface-soft p-6 text-center text-sm text-muted-foreground">
                  No exact matches. Try widening your filters.
                </div>
              ) : (
                results?.map((c) => <ClassCard key={c.id} cls={c} variant="compact" />)
              )}
            </div>

            <Link to="/search" className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-surface-soft text-sm font-semibold">
              Browse all classes
            </Link>
          </div>
        )}
      </div>

      {step < 3 && (
        <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/95 p-4 backdrop-blur-xl">
          <button
            onClick={next}
            disabled={(step === 0 && !age) || (step === 1 && !category) || (step === 2 && !budget)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop disabled:opacity-40"
          >
            {step === 2 ? "See my matches" : "Continue"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </AppShell>
  );
}

function Step({
  title, subtitle, options,
}: {
  title: string; subtitle: string;
  options: Array<{ key: string; label: string; emoji: string; active: boolean; onClick: () => void }>;
}) {
  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-extrabold leading-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6 space-y-2.5">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={o.onClick}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left text-sm font-semibold transition",
              o.active ? "border-foreground bg-foreground text-background shadow-pop" : "border-border bg-surface hover:border-primary"
            )}
          >
            <span className="text-2xl">{o.emoji}</span>
            <span className="flex-1">{o.label}</span>
            {o.active && <span>✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
