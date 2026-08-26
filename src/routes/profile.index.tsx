import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Clock, LogOut, Settings } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [counts, setCounts] = useState({ saved: 0, viewed: 0 });

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
    Promise.all([
      supabase.from("saved_classes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("viewed_classes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([s, v]) => setCounts({ saved: s.count ?? 0, viewed: v.count ?? 0 }));
  }, [user, loading, navigate]);

  if (!user) return null;

  return (
    <AppShell>
      <div className="bg-gradient-hero px-5 pb-8 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-2xl font-extrabold text-background">
            {(profile?.full_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-extrabold">{profile?.full_name || "Welcome"}</h1>
            <p className="text-sm text-foreground/70">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 pt-5">
        <ProfileLink to="/profile/saved" icon={<Heart className="h-5 w-5" />} label="Saved classes" badge={counts.saved} />
        <ProfileLink to="/profile/history" icon={<Clock className="h-5 w-5" />} label="Viewed history" badge={counts.viewed} />
        <ProfileLink to="/school/onboarding" icon={<Settings className="h-5 w-5" />} label="Become a partner school" />

        <button
          onClick={() => signOut().then(() => navigate({ to: "/" }))}
          className="flex w-full items-center gap-3 rounded-2xl bg-surface-soft p-4 text-left text-sm font-semibold text-destructive shadow-soft"
        >
          <LogOut className="h-5 w-5" /> Sign out
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
