import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { School, BookOpen, Inbox, Users as UsersIcon, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

interface Stats {
  schools: number;
  classes: number;
  leads: number;
  newLeads: number;
  users: number;
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLeads, setRecentLeads] = useState<Array<{ id: string; parent_name: string; created_at: string; status: string }>>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("schools").select("*", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("classes").select("*", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("leads").select("id,parent_name,created_at,status").order("created_at", { ascending: false }).limit(5),
    ]).then(([s, c, l, nl, u, recent]) => {
      setStats({
        schools: s.count ?? 0,
        classes: c.count ?? 0,
        leads: l.count ?? 0,
        newLeads: nl.count ?? 0,
        users: u.count ?? 0,
      });
      setRecentLeads((recent.data as any) ?? []);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of activity on activoo.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Schools" value={stats?.schools} icon={<School className="h-4 w-4" />} to="/admin/schools" />
        <StatCard label="Classes" value={stats?.classes} icon={<BookOpen className="h-4 w-4" />} to="/admin/classes" />
        <StatCard label="Leads (new)" value={stats?.newLeads} hint={stats ? `${stats.leads} total` : undefined} icon={<Inbox className="h-4 w-4" />} to="/admin/leads" highlight />
        <StatCard label="Users" value={stats?.users} icon={<UsersIcon className="h-4 w-4" />} to="/admin/users" />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Recent leads</h2>
          <Link to="/admin/leads" className="flex items-center gap-1 text-xs font-semibold text-primary-strong">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No leads yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentLeads.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium">{l.parent_name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div>
                </div>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold uppercase text-primary-strong">{l.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, to, hint, highlight }: { label: string; value?: number; icon: React.ReactNode; to: string; hint?: string; highlight?: boolean }) {
  return (
    <Link
      to={to}
      className={`group rounded-2xl border border-border bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card ${highlight ? "ring-2 ring-primary/40" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between text-foreground/60">
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        <span className="text-primary-strong">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value ?? "—"}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </Link>
  );
}
