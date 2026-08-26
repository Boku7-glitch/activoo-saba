import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Admin login — activoo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Password required").max(72),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading, refreshRole, signOut } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // If already signed in as admin → go straight to /admin
  useEffect(() => {
    if (loading) return;
    if (user && isAdmin) navigate({ to: "/admin" });
  }, [user, isAdmin, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { fe[String(i.path[0])] = i.message; });
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) { toast.error(error.message); return; }

      // Verify admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const isAdminUser = (roles ?? []).some((r) => r.role === "admin");

      if (!isAdminUser) {
        await supabase.auth.signOut();
        toast.error("This account does not have admin access.");
        return;
      }

      await refreshRole();
      toast.success("Welcome back, admin");
      navigate({ to: "/admin" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center"><Logo height={22} /></Link>

        <div className="rounded-3xl border border-border bg-surface p-7 shadow-soft">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold">Admin sign-in</h1>
              <p className="text-xs text-foreground/60">Restricted area — staff only</p>
            </div>
          </div>

          {user && !isAdmin && (
            <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              Signed in as <b>{user.email}</b> — this account is not an admin.{" "}
              <button
                type="button"
                className="underline"
                onClick={async () => { await signOut(); }}
              >
                Sign out
              </button>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            <Field
              label="Admin email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              error={errors.email}
            />
            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              error={errors.password}
            />

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop transition disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in to admin"}
            </button>
          </form>

          <Link
            to="/"
            className="mt-5 block text-center text-xs text-foreground/60 hover:text-foreground"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", autoComplete, error,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; autoComplete?: string; error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
      />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
