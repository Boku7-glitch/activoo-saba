import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES, CATEGORY_KEYS, DISTRICTS, type CategoryKey } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/school/onboarding")({ component: OnboardingPage });

function OnboardingPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [district, setDistrict] = useState<typeof DISTRICTS[number] | "">("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<CategoryKey>("creativity");
  const [ageMin, setAgeMin] = useState("4");
  const [ageMax, setAgeMax] = useState("12");

  // Step 2 (AI)
  const [shortDesc, setShortDesc] = useState("");
  const [generated, setGenerated] = useState("");
  const [generating, setGenerating] = useState(false);

  // Step 3
  const [price, setPrice] = useState("50");
  const [schedule, setSchedule] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const generate = () => {
    if (!shortDesc.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerated(
        `${shortDesc.trim()}\n\nWhat your child will love:\n• Friendly, certified instructors who make learning fun\n• Small group sizes for personal attention\n• A safe, welcoming space designed for kids\n• Real progress they can show off at home\n\nJoin a community of families who chose ${name || "us"} to spark their child's curiosity.`
      );
      setGenerating(false);
    }, 900);
  };

  const publish = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Ensure school role
      if (role !== "school") {
        await supabase.from("user_roles").insert({ user_id: user.id, role: "school" });
      }
      const { data: school, error: sErr } = await supabase.from("schools")
        .insert({ owner_id: user.id, name, district: district || "Vake", phone, description: generated || shortDesc })
        .select("id").single();
      if (sErr || !school) throw sErr;
      const cat = CATEGORIES[category];
      const { error: cErr } = await supabase.from("classes").insert({
        school_id: school.id,
        title: `${cat.label} class at ${name}`,
        category,
        description: generated || shortDesc,
        age_min: Number(ageMin),
        age_max: Number(ageMax),
        price_from: Number(price),
        format: "group",
        language: "English",
        schedule,
        image_url: null,
        is_new: true,
        is_featured: false,
      });
      if (cErr) throw cErr;
      toast.success("Your school is live on activoo!");
      setDone(true);
      setTimeout(() => navigate({ to: "/school/dashboard" }), 1500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <AppShell hideTabBar hideHeader>
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-accent-strong" />
          <h1 className="mt-4 text-2xl font-extrabold">You're live! 🎉</h1>
          <p className="mt-2 text-sm text-muted-foreground">Taking you to your dashboard…</p>
        </div>
      </AppShell>
    );
  }

  const canNext = (step === 0 && name && district) || (step === 1 && (generated || shortDesc)) || (step === 2 && price);

  return (
    <AppShell hideTabBar hideHeader>
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => (step === 0 ? navigate({ to: "/" }) : setStep(step - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-foreground" : "bg-muted")} />
          ))}
        </div>
      </div>

      <div className="px-5 pb-32">
        {step === 0 && (
          <div className="animate-fade-up space-y-4">
            <div>
              <h1 className="text-2xl font-extrabold">Tell us about your school</h1>
              <p className="mt-1 text-sm text-muted-foreground">Step 1 of 4 — basic info</p>
            </div>
            <Field label="School name">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Studio Vibe" className={inputCls} />
            </Field>
            <Field label="Phone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder="+995 555 12 34 56" className={inputCls} />
            </Field>
            <Field label="District">
              <div className="flex flex-wrap gap-2">
                {DISTRICTS.map((d) => (
                  <button key={d} type="button" onClick={() => setDistrict(d)}
                    className={cn("rounded-full border px-3.5 py-1.5 text-xs font-semibold",
                      district === d ? "border-foreground bg-foreground text-background" : "border-border bg-surface")}>
                    {d}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Main category">
              <div className="flex flex-wrap gap-2">
                {CATEGORY_KEYS.map((k) => (
                  <button key={k} type="button" onClick={() => setCategory(k)}
                    className={cn("rounded-full border px-3.5 py-1.5 text-xs font-semibold",
                      category === k ? "border-foreground bg-foreground text-background" : "border-border bg-surface")}>
                    {CATEGORIES[k].emoji} {CATEGORIES[k].label}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age min"><input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} className={inputCls} /></Field>
              <Field label="Age max"><input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} className={inputCls} /></Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up space-y-4">
            <div>
              <h1 className="text-2xl font-extrabold">Describe your class</h1>
              <p className="mt-1 text-sm text-muted-foreground">Step 2 of 4 — let AI help you write</p>
            </div>
            <Field label="In 2–3 sentences, what makes your class special?">
              <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={4} maxLength={500} className={inputCls + " resize-none p-4 h-auto"} placeholder="We teach hip-hop to kids 6–12 in a fun supportive studio…" />
            </Field>
            <button type="button" onClick={generate} disabled={generating || !shortDesc.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-foreground shadow-soft disabled:opacity-50">
              <Sparkles className="h-4 w-4" /> {generating ? "Generating…" : "Generate description with AI"}
            </button>
            {generated && (
              <div>
                <p className="mb-1.5 text-xs font-semibold">AI-generated (you can edit)</p>
                <textarea value={generated} onChange={(e) => setGenerated(e.target.value)} rows={10} className={inputCls + " resize-none p-4 h-auto"} />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up space-y-4">
            <div>
              <h1 className="text-2xl font-extrabold">Price & schedule</h1>
              <p className="mt-1 text-sm text-muted-foreground">Step 3 of 4</p>
            </div>
            <Field label="Price from (₾ / month)">
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Schedule">
              <input value={schedule} onChange={(e) => setSchedule(e.target.value)} maxLength={120} placeholder="Mon, Wed, Fri • 5:00 PM" className={inputCls} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-up space-y-4">
            <div>
              <h1 className="text-2xl font-extrabold">Preview & publish</h1>
              <p className="mt-1 text-sm text-muted-foreground">Step 4 of 4</p>
            </div>
            <div className="rounded-3xl bg-surface shadow-card overflow-hidden">
              <div className="aspect-[4/3] bg-gradient-hero flex items-center justify-center text-5xl">{CATEGORIES[category].emoji}</div>
              <div className="p-4 space-y-2">
                <p className="text-xs font-semibold text-primary-strong">{CATEGORIES[category].emoji} {CATEGORIES[category].label}</p>
                <h2 className="font-extrabold">{CATEGORIES[category].label} class at {name}</h2>
                <p className="text-xs text-muted-foreground">{district} • Ages {ageMin}–{ageMax} • from {price} ₾</p>
                <p className="text-sm whitespace-pre-line line-clamp-6">{generated || shortDesc}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/95 p-4 backdrop-blur-xl">
        <button
          onClick={() => (step < 3 ? setStep(step + 1) : publish())}
          disabled={!canNext || submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop disabled:opacity-40"
        >
          {step < 3 ? <>Continue <ArrowRight className="h-4 w-4" /></> : (submitting ? "Publishing…" : "Publish my school")}
        </button>
      </div>
    </AppShell>
  );
}

const inputCls = "h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      {children}
    </label>
  );
}
