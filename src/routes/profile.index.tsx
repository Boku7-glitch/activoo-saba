import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Clock, LogOut, Bell } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile/")({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: "My Profile — activoo" }],
  }),
});

function ProfilePage() {
  const { user, role, loading, signOut } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [school, setSchool] = useState<{ id: string; name: string; slug: string; logo_url: string | null } | null>(null);
  const [counts, setCounts] = useState({ saved: 0, viewed: 0, replies: 0, classes: 0, schoolLeads: 0 });

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));

    if (role === "school") {
      supabase.from("schools").select("id, name, slug, logo_url").eq("owner_id", user.id).is("deleted_at", null).limit(1).maybeSingle()
        .then(({ data }) => {
          setSchool(data);
          if (data) {
            Promise.all([
              supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", data.id).is("deleted_at", null),
              supabase.from("leads").select("id", { count: "exact", head: true }).eq("school_id", data.id).eq("status", "new"),
            ]).then(([cl, ld]) => {
              setCounts((prev) => ({ ...prev, classes: cl.count ?? 0, schoolLeads: ld.count ?? 0 }));
            });
          }
        });
    }

    Promise.all([
      supabase.from("saved_classes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("viewed_classes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("parent_user_id", user.id).eq("status", "contacted"),
    ]).then(([s, v, r]) => setCounts((prev) => ({ ...prev, saved: s.count ?? 0, viewed: v.count ?? 0, replies: r.count ?? 0 })));
  }, [user, role, loading, navigate]);

  if (!user) return null;

  return (
    <AppShell>
      <div className="bg-gradient-hero px-5 pb-8 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-2xl font-extrabold text-background">
            {(profile?.full_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold">{profile?.full_name || t("profile.welcome")}</h1>
              {role === "school" && (
                <span className="rounded-full bg-accent-strong/20 px-2 py-0.5 text-xs font-bold text-accent-strong">
                  {lang === "en" ? "School" : "სკოლა"}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground/70">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 pt-5">
        {/* School Management Section */}
        {role === "school" && (
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {lang === "en" ? "School Portal" : "სკოლის მართვის პანელი"}
                </span>
                <h2 className="mt-0.5 text-lg font-bold">
                  {school ? school.name : (lang === "en" ? "Setup your school" : "დაარეგისტრირეთ თქვენი სკოლა")}
                </h2>
              </div>
              <span className="text-3xl">🏫</span>
            </div>

            {school ? (
              <div className="mt-4 space-y-2">
                <Link
                  to="/school/dashboard"
                  className="flex items-center justify-between rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background shadow-pop transition hover:opacity-95"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    {lang === "en" ? "Open School Dashboard" : "სკოლის კაბინეტში გადასვლა"}
                  </span>
                  {counts.schoolLeads > 0 && (
                    <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white">
                      {counts.schoolLeads} {lang === "en" ? "new leads" : "ახალი"}
                    </span>
                  )}
                </Link>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <Link
                    to="/school/dashboard"
                    className="flex flex-col rounded-xl bg-surface-soft p-3 font-semibold transition hover:bg-muted"
                  >
                    <span className="text-muted-foreground">{lang === "en" ? "Active classes" : "აქტიური წრეები"}</span>
                    <span className="mt-1 text-base font-extrabold">{counts.classes}</span>
                  </Link>
                  <Link
                    to="/school/dashboard"
                    className="flex flex-col rounded-xl bg-surface-soft p-3 font-semibold transition hover:bg-muted"
                  >
                    <span className="text-muted-foreground">{lang === "en" ? "New applications" : "განაცხადები"}</span>
                    <span className="mt-1 text-base font-extrabold">{counts.schoolLeads}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">
                  {lang === "en"
                    ? "Complete your school profile to start publishing classes and receiving parent leads."
                    : "დაასრულეთ სკოლის რეგისტრაცია წრეების დასამატებლად და განაცხადების მისაღებად."}
                </p>
                <Link
                  to="/school/onboarding"
                  className="mt-3 flex w-full items-center justify-center rounded-2xl bg-foreground px-4 py-2.5 text-sm font-bold text-background shadow-pop transition"
                >
                  {lang === "en" ? "Complete School Setup →" : "სკოლის რეგისტრაციის დასრულება →"}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Regular Account Links */}
        <div className="space-y-2.5">
          <ProfileLink to="/profile/saved" icon={<Heart className="h-5 w-5" />} label={t("profile.savedClasses")} badge={counts.saved} />
          <ProfileLink to="/profile/history" icon={<Clock className="h-5 w-5" />} label={t("profile.viewedHistory")} badge={counts.viewed} />
          <ProfileLink to="/profile/notifications" icon={<Bell className="h-5 w-5" />} label={t("profile.notifications")} badge={counts.replies} />
        </div>

        <button
          onClick={() => signOut().then(() => navigate({ to: "/" }))}
          className="flex w-full items-center gap-3 rounded-2xl bg-surface-soft p-4 text-left text-sm font-semibold text-destructive shadow-soft transition hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" /> {t("common.signOut")}
        </button>
      </div>
    </AppShell>
  );
}

function ProfileLink({ to, icon, label, badge }: { to: string; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-soft transition hover:shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/30 text-primary-strong">{icon}</div>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-bold text-background">{badge}</span>
      )}
      <span className="text-muted-foreground">›</span>
    </Link>
  );
}
