import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  password: z.string().min(8, "At least 8 characters").max(72),
  confirm: z.string(),
});

export const Route = createFileRoute("/auth/reset")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset password — activoo" },
      { name: "description", content: "Set a new password for your activoo account." },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let resolved = false;

    // Supabase fires PASSWORD_RECOVERY or SIGNED_IN once session is active
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        resolved = true;
        setReady(true);
        setChecking(false);
      }
    });

    const init = async () => {
      // 1. Check for PKCE exchange code in URL (e.g. ?code=...)
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeErr && data.session) {
            resolved = true;
            setReady(true);
            setChecking(false);
            return;
          }
        }
      }

      // 2. Check existing session (e.g. hash token already parsed by Supabase client)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        resolved = true;
        setReady(true);
        setChecking(false);
        return;
      }

      // 3. Allow a short grace window for hash processing if URL has hash
      if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
        setTimeout(() => {
          if (!resolved) {
            supabase.auth.getSession().then(({ data: sessData }) => {
              if (sessData.session) {
                setReady(true);
              }
              setChecking(false);
            });
          }
        }, 1000);
      } else {
        setChecking(false);
      }
    };

    init();

    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Invalid password"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { toast.error(err.message); return; }
    toast.success("Password updated! You are signed in.");
    navigate({ to: "/" });
  };

  return (
    <AppShell hideHeader hideTabBar>
      <div className="flex min-h-screen flex-col bg-gradient-hero px-5 pb-10 pt-8">
        <Link to="/" className="self-start"><Logo height={22} /></Link>
        <div className="mt-10 animate-fade-up rounded-3xl bg-surface p-6 shadow-soft">
          <h1 className="text-2xl font-extrabold leading-tight">Set a new password</h1>
          {checking ? (
            <div className="mt-6 flex items-center justify-center py-6 text-sm text-foreground/60">
              Verifying reset link...
            </div>
          ) : ready ? (
            <form onSubmit={submit} className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold">New password</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 pr-11 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground/50 hover:text-foreground transition focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold">Repeat password</span>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 pr-11 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground/50 hover:text-foreground transition focus:outline-none"
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop transition disabled:opacity-50"
              >
                {loading ? "Please wait..." : "Update password"}
              </button>
            </form>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-foreground/75">
                This reset link is invalid or has expired. Please request a new one.
              </p>
              <Link
                to="/auth"
                className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop"
              >
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
