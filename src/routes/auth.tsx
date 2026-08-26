import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const signUpSchema = z.object({
  full_name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Password required").max(72),
});

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — activoo" },
      { name: "description", content: "Sign in or create your activoo account as a parent or school." },
    ],
  }),
});

function safeNext(next: string | undefined): string | null {
  if (!next) return null;
  // same-origin relative path only
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

type Mode = "signin" | "signup";
type Role = "parent" | "school";

function AuthPage() {
  const navigate = useNavigate();
  const { refreshRole } = useAuth();
  const { next } = Route.useSearch();
  const nextPath = safeNext(next);
  const [mode, setMode] = useState<Mode>("signin");
  const [role, setRole] = useState<Role>("parent");
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const goNext = (fallback: string) => {
    if (nextPath) { window.location.href = nextPath; return; }
    navigate({ to: fallback });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success) {
          const fe: Record<string, string> = {};
          parsed.error.issues.forEach((i) => { fe[String(i.path[0])] = i.message; });
          setErrors(fe); return;
        }
        const redirectTo = nextPath
          ? `${window.location.origin}${nextPath}`
          : `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: redirectTo, data: { full_name: parsed.data.full_name } },
        });
        if (error) { toast.error(error.message); return; }

        // თუ session არსებობს (Email Confirmation არ არის საჭირო)
        if (data.session) {
          await supabase.from("user_roles").insert({ user_id: data.user!.id, role });
          await refreshRole();
          toast.success("Welcome to activoo!");
          goNext(role === "school" ? "/school/onboarding" : "/");
        } else if (data.user) {
          // თუ საჭიროა Email-ის დადასტურება (RLS-ის გამო კლიენტიდან როლს ვერ ჩავწერთ)
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const parsed = signInSchema.safeParse(form);
        if (!parsed.success) {
          const fe: Record<string, string> = {};
          parsed.error.issues.forEach((i) => { fe[String(i.path[0])] = i.message; });
          setErrors(fe); return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email, password: parsed.data.password,
        });
        if (error) { toast.error(error.message); return; }
        await refreshRole();
        const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
        toast.success("Welcome back!");
        goNext(roleRow?.role === "school" ? "/school/dashboard" : "/");
      }
    } finally { setLoading(false); }
  };

  return (
    <AppShell hideHeader hideTabBar>
      <div className="flex min-h-screen flex-col bg-gradient-hero px-5 pb-10 pt-8">
        <Link to="/" className="self-start"><Logo height={22} /></Link>

        <div className="mt-10 animate-fade-up">
          <h1 className="text-3xl font-extrabold leading-tight">
            {mode === "signin" ? "Welcome back" : "Join activoo"}
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            {mode === "signin" ? "Sign in to save classes and track requests." : "Create your account in seconds."}
          </p>
        </div>

        {mode === "signup" && (
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1 shadow-soft">
            <RolePill active={role === "parent"} onClick={() => setRole("parent")} emoji="👨‍👩‍👧" label="I'm a parent" />
            <RolePill active={role === "school"} onClick={() => setRole("school")} emoji="🏫" label="I run a school" />
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <Input
              label="Full name"
              value={form.full_name}
              onChange={(v) => setForm({ ...form, full_name: v })}
              placeholder="Anna Smith"
              error={errors.full_name}
              autoComplete="name"
            />
          )}
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            placeholder="you@example.com"
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            error={errors.password}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-13 w-full items-center justify-center rounded-2xl bg-foreground py-3.5 text-sm font-bold text-background shadow-pop transition disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErrors({}); }}
          className="mt-6 text-center text-sm text-foreground/80"
        >
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <span className="font-bold text-primary-strong">{mode === "signin" ? "Create account" : "Sign in"}</span>
        </button>
      </div>
    </AppShell>
  );
}

function RolePill({ active, onClick, emoji, label }: { active: boolean; onClick: () => void; emoji: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition",
        active ? "bg-foreground text-background shadow-pop" : "text-foreground/70"
      )}
    >
      <span>{emoji}</span>{label}
    </button>
  );
}

function Input({
                 label, value, onChange, type = "text", placeholder, error, autoComplete,
               }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; error?: string; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
      />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
