import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Eye, MessageSquare, Plus, LogOut, Phone, Pencil, Trash2, Settings, ExternalLink, Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { SchoolEditorModal, type SchoolEditable } from "@/components/SchoolEditor";
import {
  ClassEditorModal,
  type ClassEditable,
  type ViewOption,
  type CatOption,
  type SubOption,
} from "@/components/ClassEditor";

interface School extends SchoolEditable { id: string; name: string; district: string; slug?: string; is_visible?: boolean | null }
interface ClassRow extends ClassEditable { id: string; title: string; view_count?: number | null; approval_status?: string | null; rejection_reason?: string | null }
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

export const Route = createFileRoute("/school/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "School Dashboard — activoo" },
      { name: "description", content: "Manage your school profile, classes, and leads on activoo." },
    ],
  }),
});

function DashboardPage() {
  const { user, loading, signOut, roles, refreshRole } = useAuth();
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [ready, setReady] = useState(false);

  // Editor state
  const [editingSchool, setEditingSchool] = useState<SchoolEditable | null>(null);
  const [editingClass, setEditingClass] = useState<ClassEditable | null>(null);
  const [views, setViews] = useState<ViewOption[]>([]);
  const [cats, setCats] = useState<CatOption[]>([]);
  const [subs, setSubs] = useState<SubOption[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: ss } = await supabase.from("schools").select("*").eq("owner_id", user.id).is("deleted_at", null);
    const ssRows = (ss ?? []) as School[];
    setSchools(ssRows);
    if (ssRows.length === 0) { setReady(true); return; }
    const ids = ssRows.map((s) => s.id);
    const [{ data: cs }, { data: ls }, { data: vw }, { data: vc }, { data: vs }] = await Promise.all([
      supabase.from("classes").select("*").in("school_id", ids).is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("leads").select("id,parent_name,parent_phone,child_age,message,status,created_at,classes(title)")
        .in("school_id", ids).order("created_at", { ascending: false }).limit(50),
      supabase.from("views").select("id,name,slug").order("sort_order"),
      supabase.from("view_categories").select("id,name,view_id").order("sort_order"),
      supabase.from("view_subcategories").select("id,name,category_id").order("sort_order"),
    ]);
    setClasses((cs ?? []) as ClassRow[]);
    setLeads((ls ?? []) as unknown as Lead[]);
    setViews((vw as ViewOption[]) ?? []);
    setCats((vc as CatOption[]) ?? []);
    setSubs((vs as SubOption[]) ?? []);
    setReady(true);
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    load();
  }, [user, loading, navigate, load]);

  // Poll for new incoming messages so the school gets notified in the dashboard
  const [seenLeadIds, setSeenLeadIds] = useState<string[] | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (seenLeadIds === null) { setSeenLeadIds(leads.map((l) => l.id)); return; }
    const fresh = leads.filter((l) => !seenLeadIds.includes(l.id));
    if (fresh.length > 0) {
      toast.message(fresh.length === 1 ? `New message from ${fresh[0].parent_name}` : `${fresh.length} new messages`);
      setSeenLeadIds(leads.map((l) => l.id));
    }
  }, [leads, ready, seenLeadIds]);

  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => { load(); }, 30000);
    return () => clearInterval(t);
  }, [user, load]);

  const markLeadRead = async (id: string) => {
    const { error } = await supabase.from("leads").update({ status: "contacted" }).eq("id", id);
    if (error) return toast.error(error.message);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: "contacted" } : l)));
  };


  const removeClass = async (id: string) => {
    if (!confirm("Delete this class? It will be archived and can be restored by support.")) return;
    const { error } = await supabase.from("classes").update({ deleted_at: new Date().toISOString(), deleted_by: user?.id ?? null }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Class deleted");
    load();
  };

  const removeSchool = async (id: string) => {
    if (!confirm("Delete your school page and all its classes? The data is archived and can be restored by support.")) return;
    const stamp = new Date().toISOString();
    const { error } = await supabase.from("schools").update({ deleted_at: stamp, deleted_by: user?.id ?? null }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("classes").update({ deleted_at: stamp, deleted_by: user?.id ?? null }).eq("school_id", id).is("deleted_at", null);
    toast.success("School deleted");
    load();
  };

  if (!user || !ready) return <AppShell><div className="p-8 text-muted-foreground">Loading…</div></AppShell>;

  if (schools.length === 0) {
    return (
      <AppShell>
        <div className="px-5 pt-6 max-w-md mx-auto md:max-w-lg">
          <h1 className="text-2xl font-extrabold">Welcome 👋</h1>
          <p className="mt-2 text-sm text-muted-foreground">You don't have a school page yet. Create one now.</p>
          <button
            onClick={async () => {
              if (user && !roles.includes("school")) {
                await supabase.from("user_roles").insert({ user_id: user.id, role: "school" });
                await refreshRole();
              }
              setEditingSchool({ name: "", district: "", verified: false, social_links: {} });
            }}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop"
          >
            <Plus className="mr-2 h-4 w-4" /> Create school page
          </button>
          <Link to="/school/onboarding" className="mt-3 flex h-11 w-full items-center justify-center rounded-2xl bg-surface-soft text-sm font-semibold">
            Use guided onboarding instead
          </Link>
        </div>
        {editingSchool && (
          <SchoolEditorModal
            school={editingSchool}
            ownerScoped
            allowVerifiedEdit={false}
            onClose={() => setEditingSchool(null)}
            onSaved={() => { setEditingSchool(null); load(); }}
          />
        )}
      </AppShell>
    );
  }

  const totalViews = classes.reduce((sum, c) => sum + (c.view_count ?? 0), 0);
  const newLeads = leads.filter((l) => l.status === "new").length;
  const primary = schools[0];

  return (
    <AppShell>
      <div className="bg-gradient-hero px-5 pb-6 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">Dashboard</p>
            <h1 className="mt-1 text-2xl font-extrabold truncate">{primary?.name}</h1>
            <p className="text-sm text-foreground/70">{primary?.district}</p>
            {primary?.is_visible === false && (
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                Not published — visible only to you
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {primary?.slug && (
              <a
                href={`/schools/${primary.slug}${primary.is_visible === false ? "?preview=1" : ""}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-bold shadow-soft"
              >
                <ExternalLink className="h-3.5 w-3.5" /> {primary.is_visible === false ? "Preview" : "View"}
              </a>
            )}
            <button
              onClick={async () => {
                const next = primary.is_visible === false;
                const { error } = await supabase.from("schools").update({ is_visible: next }).eq("id", primary.id);
                if (error) return toast.error(error.message);
                toast.success(next ? "School published" : "School hidden");
                load();
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-soft ${primary.is_visible === false ? "bg-emerald-600 text-white" : "bg-surface"}`}
            >
              {primary.is_visible === false ? "Publish school" : "Hide school"}
            </button>
            <button
              onClick={() => setEditingSchool(primary)}
              className="flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background shadow-pop"
            >
              <Settings className="h-3.5 w-3.5" /> Edit profile
            </button>
            <button
              onClick={() => removeSchool(primary.id)}
              className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-destructive shadow-soft"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete school
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat icon={<Eye className="h-4 w-4" />} value={totalViews.toString()} label="Page views" />
          <Stat icon={<MessageSquare className="h-4 w-4" />} value={`${leads.length}`} label={`${newLeads} new leads`} />
        </div>

        {newLeads > 0 && (
          <a href="#leads" className="mt-4 flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-soft">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent/40">
              <Bell className="h-5 w-5 text-accent-strong" />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {newLeads}
              </span>
            </span>
            <span className="min-w-0 flex-1 text-sm font-semibold">
              {newLeads === 1 ? "1 new message from a parent" : `${newLeads} new messages from parents`}
            </span>
          </a>
        )}
      </div>


      <section className="px-4 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Your classes ({classes.length})</h2>
          <button
            onClick={() => setEditingClass({
              title: "", category: "creativity", age_min: 5, age_max: 12, price_from: 0,
              format: "group", formats: ["group"], schedule_days: [], category_ids: [],
              subcategory_ids: [], is_visible: true, school_id: primary.id,
            })}
            className="text-sm font-semibold text-primary-strong"
          >
            + Add class
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {classes.length === 0 ? (
            <div className="rounded-2xl bg-surface-soft p-6 text-center text-sm text-muted-foreground">
              No classes yet. Add your first one.
            </div>
          ) : classes.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-3.5 shadow-soft">
              <Link to="/class/$id" params={{ id: c.id }} className="min-w-0 flex-1">
                <div className="truncate font-semibold">{c.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{c.view_count ?? 0}</span>
                  {!c.is_visible && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase">Hidden</span>}
                  {c.approval_status === "pending" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">Waiting for approval</span>}
                  {c.approval_status === "rejected" && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">Rejected</span>}
                </div>
                {c.approval_status === "rejected" && c.rejection_reason && (
                  <div className="mt-1 text-xs text-destructive">{c.rejection_reason}</div>
                )}
              </Link>
              <button
                onClick={() => setEditingClass(c)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-soft hover:bg-muted"
                aria-label="Edit class"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeClass(c.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                aria-label="Delete class"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="leads" className="px-4 pt-6">
        <h2 className="text-base font-bold">Messages & requests {newLeads > 0 ? `(${newLeads} new)` : ""}</h2>
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
                <div className="mt-3 flex gap-2">
                  <a href={`tel:${l.parent_phone}`} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-bold text-background">
                    <Phone className="h-4 w-4" /> {l.parent_phone}
                  </a>
                  {l.status === "new" && (
                    <button
                      onClick={() => markLeadRead(l.id)}
                      className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-surface-soft px-3 text-sm font-semibold"
                    >
                      <Check className="h-4 w-4" /> Mark read
                    </button>
                  )}
                </div>
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

      {editingSchool && (
        <SchoolEditorModal
          school={editingSchool}
          ownerScoped
          allowVerifiedEdit={false}
          onClose={() => setEditingSchool(null)}
          onSaved={() => { setEditingSchool(null); load(); }}
        />
      )}
      {editingClass && (
        <ClassEditorModal
          cls={editingClass}
          schools={schools.map((s) => ({ id: s.id, name: s.name }))}
          views={views}
          cats={cats}
          subs={subs}
          lockSchool={schools.length === 1}
          onClose={() => setEditingClass(null)}
          onSaved={() => { setEditingClass(null); load(); }}
        />
      )}
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
