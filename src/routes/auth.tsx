import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
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
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" ? { next: s.next } : {},
  head: () => ({
    meta: [
      { title: "Sign in — activoo" },
      { name: "description", content: "Sign in, or create an activoo account — as a user looking for classes, or as a school." },
    ],
  }),
});

function safeNext(next: string | undefined): string | null {
  if (!next) return null;
  // same-origin relative path only
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

type Mode = "signin" | "signup" | "reset";
type Role = "parent" | "school";

function AuthPage() {
  const navigate = useNavigate();
  const { refreshRole } = useAuth();
  const { lang, t } = useI18n();
  const { next } = Route.useSearch();
  const nextPath = safeNext(next);
  const [mode, setMode] = useState<Mode>("signin");
  const [role, setRole] = useState<Role>("parent");
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [resetSent, setResetSent] = useState<string | null>(null);

  const goNext = (fallback: string) => {
    if (nextPath) { window.location.href = nextPath; return; }
    navigate({ to: fallback });
  };

  const redirectTo = () =>
    nextPath ? `${window.location.origin}${nextPath}` : `${window.location.origin}/`;

  const resend = async () => {
    if (!pendingEmail) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
      options: { emailRedirectTo: redirectTo() },
    });
    setResending(false);
    if (error) toast.error(error.message);
    else toast.success("Confirmation email sent again.");
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = z.string().trim().email("Invalid email").max(255).safeParse(form.email);
    if (!parsed.success) { setErrors({ email: "Invalid email" }); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setResetSent(parsed.data);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success || !acceptTerms) {
          const fe: Record<string, string> = {};
          if (!parsed.success) {
            parsed.error.issues.forEach((i) => { fe[String(i.path[0])] = i.message; });
          }
          if (!acceptTerms) fe.terms = "You must accept the Terms & Conditions";
          setErrors(fe); return;
        }
        window.localStorage.setItem("activoo_pending_role", role);
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: redirectTo(), data: { full_name: parsed.data.full_name } },
        });
        if (error) { toast.error(error.message); return; }
        if (data.session && data.user) {
          await supabase.from("user_roles").insert({ user_id: data.user.id, role });
          window.localStorage.removeItem("activoo_pending_role");
          await refreshRole();
          toast.success("Welcome to activoo!");
          goNext(role === "school" ? "/school/onboarding" : "/");
        } else {
          // Email confirmation required — show a clear "check your inbox" step
          setPendingEmail(parsed.data.email);
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
        if (error) {
          if (/confirm/i.test(error.message)) {
            setPendingEmail(parsed.data.email);
            toast.error("Please confirm your email first.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        await refreshRole();
        const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
        toast.success("Welcome back!");
        goNext(roleRow?.role === "school" ? "/school/dashboard" : "/");
      }
    } finally { setLoading(false); }
  };

  if (pendingEmail) {
    return (
      <AppShell hideHeader hideTabBar>
        <div className="flex min-h-screen flex-col bg-gradient-hero px-5 pb-10 pt-8">
          <Link to="/" className="self-start"><Logo height={22} /></Link>
          <div className="mt-10 animate-fade-up rounded-3xl bg-surface p-6 shadow-soft">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-2xl">📩</div>
            <h1 className="mt-4 text-2xl font-extrabold leading-tight">{t("auth.confirmEmail")}</h1>
            <p className="mt-2 text-sm text-foreground/75">
              {lang === "en" ? "We sent a confirmation link to " : "დადასტურების ბმული გაიგზავნა მისამართზე: "}
              <span className="font-bold text-foreground">{pendingEmail}</span>.
              {lang === "en" ? " Open it to activate your account." : " გახსენით ანგარიშის გასააქტიურებლად."}
            </p>
            <button
              onClick={resend}
              disabled={resending}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop transition disabled:opacity-50"
            >
              {resending ? t("common.sending") : t("auth.resendEmail")}
            </button>
            <button
              onClick={() => { setPendingEmail(null); setMode("signin"); }}
              className="mt-3 w-full text-center text-sm font-semibold text-primary-strong"
            >
              {t("auth.backToSignIn")}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (mode === "reset") {
    return (
      <AppShell hideHeader hideTabBar>
        <div className="flex min-h-screen flex-col bg-gradient-hero px-5 pb-10 pt-8">
          <Link to="/" className="self-start"><Logo height={22} /></Link>
          <div className="mt-10 animate-fade-up rounded-3xl bg-surface p-6 shadow-soft">
            {resetSent ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-2xl">📩</div>
                <h1 className="mt-4 text-2xl font-extrabold leading-tight">{t("auth.checkInbox")}</h1>
                <p className="mt-2 text-sm text-foreground/75">
                  {lang === "en"
                    ? `If an account exists for ${resetSent}, we sent a password reset link.`
                    : `თუ ანგარიში არსებობს მისამართით ${resetSent}, გაიგზავნა პაროლის აღდგენის ბმული.`}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold leading-tight">{t("auth.resetPassword")}</h1>
                <p className="mt-2 text-sm text-foreground/75">
                  {lang === "en" ? "Enter your account email and we'll send you a reset link." : "შეიყვანეთ თქვენი ელ-ფოსტა და გამოგიგზავნით აღდგენის ბმულს."}
                </p>
                <form onSubmit={sendReset} className="mt-5 space-y-3">
                  <Input
                    label={t("auth.email")}
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                    placeholder="you@example.com"
                    error={errors.email}
                    autoComplete="email"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop transition disabled:opacity-50"
                  >
                    {loading ? t("common.loading") : t("auth.sendResetLink")}
                  </button>
                </form>
              </>
            )}
            <button
              onClick={() => { setMode("signin"); setResetSent(null); setErrors({}); }}
              className="mt-4 w-full text-center text-sm font-semibold text-primary-strong"
            >
              {t("auth.backToSignIn")}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell hideHeader hideTabBar>
      <div className="flex min-h-screen flex-col bg-gradient-hero px-5 pb-10 pt-8">
        <Link to="/" className="self-start"><Logo height={22} /></Link>

        <div className="mt-10 animate-fade-up">
          <h1 className="text-3xl font-extrabold leading-tight">
            {mode === "signin" ? t("auth.welcomeBack") : t("auth.join")}
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            {mode === "signin" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
          </p>
        </div>

        {mode === "signup" && (
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1 shadow-soft">
            <RolePill active={role === "parent"} onClick={() => setRole("parent")} emoji="🔎" label={t("auth.parentRole")} />
            <RolePill active={role === "school"} onClick={() => setRole("school")} emoji="🏫" label={t("auth.schoolRole")} />
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <Input
              label={t("auth.fullName")}
              value={form.full_name}
              onChange={(v) => setForm({ ...form, full_name: v })}
              placeholder={lang === "en" ? "Anna Smith" : "ანა ბერიძე"}
              error={errors.full_name}
              autoComplete="name"
            />
          )}
          <Input
            label={t("auth.email")}
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            placeholder="you@example.com"
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label={t("auth.password")}
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            placeholder={mode === "signup" ? t("auth.passwordSignupHint") : t("auth.passwordSigninHint")}
            error={errors.password}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />

          {mode === "signin" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setMode("reset"); setErrors({}); }}
                className="text-xs font-semibold text-primary-strong"
              >
                {t("auth.forgotPassword")}
              </button>
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label className="flex items-start gap-2.5 text-xs text-foreground/75">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span>
                  {t("auth.agree")}{" "}
                  <Link to="/terms" className="font-bold text-primary-strong underline">{t("auth.terms")}</Link>
                  {" "}{t("auth.and")}{" "}
                  <Link to="/privacy" className="font-bold text-primary-strong underline">{t("auth.privacy")}</Link>
                </span>
              </label>
              {errors.terms && <span className="mt-1 block text-xs text-destructive">{errors.terms}</span>}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-13 w-full items-center justify-center rounded-2xl bg-foreground py-3.5 text-sm font-bold text-background shadow-pop transition disabled:opacity-50"
          >
            {loading ? t("common.loading") : mode === "signin" ? t("common.signIn") : t("auth.createAccount")}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErrors({}); }}
          className="mt-6 text-center text-sm text-foreground/80"
        >
          {mode === "signin" ? t("auth.newHere") : t("auth.alreadyHave")}{" "}
          <span className="font-bold text-primary-strong">{mode === "signin" ? t("auth.createAccount") : t("common.signIn")}</span>
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
