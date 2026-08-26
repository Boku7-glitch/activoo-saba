import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, MessageSquare, Plus, LogOut, Phone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

interface School { id: string; name: string; district: string; }
interface ClassMini { id: string; title: string; view_count: number | null; }
interface Lead {
  id: string;
  parent_name: string;
  parent_phone: string;
  child_age: number | null;
  message: string | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
  classes: { title: string } | null;
}

export const Route = createFileRoute("/school/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassMini[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    (async () => {
      const { data: ss } = await supabase.from("schools").select("id,name,district").eq("owner_id", user.id);
      const ssRows = (ss ?? []) as School[];
      setSchools(ssRows);
      if (ssRows.length === 0) { setReady(true); return; }
      const ids = ssRows.map((s) => s.id);
      const { data: cs } = await supabase.from("classes").select("id,title,view_count").in("school_id", ids);
      setClasses((cs ?? []) as ClassMini[]);
      const { data: ls } = await supabase
        .from("leads")
        .select("id,parent_name,parent_phone,child_age,message,status,created_at,classes(title)")
        .in("school_id", ids)
        .order("created_at", { ascending: false })
        .limit(50);
      setLeads((ls ?? []) as unknown as Lead[]);
      setReady(true);
    })();
  }, [user, loading, navigate]);

  if (!user || !ready) return <AppShell><div className="p-8 text-muted-foreground">Loading…</div></AppShell>;

  if (schools.length === 0) {
    return (
      <AppShell>
        <div className="px-5 pt-6">
          <h1 className="text-2xl font-extrabold">Welcome 👋</h1>
          <p className="mt-2 text-sm text-muted-foreground">You don't have a school page yet. Let's set one up.</p>
          <Link to="/school/onboarding" className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop">
            <Plus className="mr-2 h-4 w-4" /> Create school page
          </Link>
        </div>
      </AppShell>
    );
  }

  const totalViews = classes.reduce((sum, c) => sum + (c.view_count ?? 0), 0);
  const newLeads = leads.filter((l) => l.status === "new").length;

  return (
    <AppShell>
      <div className="bg-gradient-hero px-5 pb-6 pt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">Dashboard</p>
        <h1 className="mt-1 text-2xl font-extrabold">{schools[0]?.name}</h1>
        <p className="text-sm text-foreground/70">{schools[0]?.district}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat icon={<Eye className="h-4 w-4" />} value={totalViews.toString()} label="Page views" />
          <Stat icon={<MessageSquare className="h-4 w-4" />} value={`${leads.length}`} label={`${newLeads} new leads`} />
        </div>
      </div>

      <section className="px-4 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Your classes ({classes.length})</h2>
          <Link to="/school/onboarding" className="text-sm font-semibold text-primary-strong">+ Add</Link>
        </div>
        <div className="mt-3 space-y-2">
          {classes.map((c) => (
            <Link key={c.id} to="/class/$id" params={{ id: c.id }} className="flex items-center justify-between rounded-2xl bg-surface p-3.5 shadow-soft">
              <span className="font-semibold">{c.title}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-3 w-3" />{c.view_count ?? 0}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-bold">Recent leads</h2>
        {leads.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-surface-soft p-6 text-center text-sm text-muted-foreground">
            No leads yet. They'll appear here when parents send requests.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {leads.map((l) => (
              <div key={l.id} className="rounded-2xl bg-surface p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{l.parent_name}</p>
                    <p className="text-xs text-muted-foreground">{l.classes?.title} {l.child_age ? `• age ${l.child_age}` : ""}</p>
                    {l.message && <p className="mt-1 text-sm text-foreground/80 line-clamp-2">{l.message}</p>}
                  </div>
                  {l.status === "new" && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase">New</span>}
                </div>
                <a href={`tel:${l.parent_phone}`} className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-bold text-background">
                  <Phone className="h-4 w-4" /> {l.parent_phone}
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="px-4 pt-6 pb-4">
        <button onClick={() => signOut().then(() => navigate({ to: "/" }))}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-soft p-3 text-sm font-semibold text-destructive">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </AppShell>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-soft">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </div>
  );
}
