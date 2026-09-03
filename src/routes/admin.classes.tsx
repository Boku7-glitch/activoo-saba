import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Star, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_KEYS, CATEGORIES, type CategoryKey } from "@/lib/categories";
import { ClassEditorModal, type ClassEditable } from "@/components/ClassEditor";

export const Route = createFileRoute("/admin/classes")({
  component: AdminClasses,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = typeof DAYS[number];
type ScheduleEntry = { day: Day; time: string };

interface ClassRow {
  id: string;
  title: string;
  category: CategoryKey;
  school_id: string;
  view_id: string | null;
  subcategory_id: string | null;
  category_ids: string[] | null;
  subcategory_ids: string[] | null;
  formats: string[] | null;
  schedule_days: ScheduleEntry[] | null;
  is_visible: boolean | null;
  approval_status?: string | null;
  description: string | null;
  age_min: number;
  age_max: number;
  price_from: number;
  format: "group" | "individual";
  language: string | null;
  schedule: string | null;
  image_url: string | null;
  gallery: string[] | null;
  benefits: string[] | null;
  is_featured: boolean | null;
  is_new: boolean | null;
  schools?: { name: string } | null;
}

interface SchoolOption { id: string; name: string; }
interface ViewOption { id: string; name: string; slug: string; }
interface CatOption { id: string; name: string; view_id: string; }
interface SubOption { id: string; name: string; category_id: string; }

function AdminClasses() {
  const [rows, setRows] = useState<ClassRow[] | null>(null);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [views, setViews] = useState<ViewOption[]>([]);
  const [cats, setCats] = useState<CatOption[]>([]);
  const [subs, setSubs] = useState<SubOption[]>([]);
  const [editing, setEditing] = useState<Partial<ClassRow> | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");

  const load = async () => {
    const [{ data: cls }, { data: sch }, { data: vw }, { data: vc }, { data: vs }] = await Promise.all([
      supabase.from("classes").select("*, schools(name)").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("schools").select("id,name").is("deleted_at", null).order("name"),
      supabase.from("views").select("id,name,slug").order("sort_order"),
      supabase.from("view_categories").select("id,name,view_id").order("sort_order"),
      supabase.from("view_subcategories").select("id,name,category_id").order("sort_order"),
    ]);
    setRows((cls as any) ?? []);
    setSchools((sch as SchoolOption[]) ?? []);
    setViews((vw as ViewOption[]) ?? []);
    setCats((vc as CatOption[]) ?? []);
    setSubs((vs as SubOption[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: string, field: "is_featured" | "is_new" | "is_visible", val: boolean) => {
    const { error } = await supabase.from("classes").update({ [field]: !val } as any).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Move this class to Deleted? You can restore it later.")) return;
    const { error } = await supabase.from("classes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Moved to Deleted");
    load();
  };

  const filtered = rows?.filter((c) =>
    (!search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCat || c.category === filterCat)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-sm text-muted-foreground">{rows?.length ?? 0} class(es) listed.</p>
        </div>
        <button
          onClick={() => setEditing({ title: "", category: "creativity", age_min: 5, age_max: 12, price_from: 0, format: "group", formats: ["group"], schedule_days: [], category_ids: [], subcategory_ids: [], is_visible: true, school_id: schools[0]?.id })}
          className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-bold text-background shadow-pop hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New class
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or ID…" className="h-11 w-full max-w-xs rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary">
          <option value="">All categories</option>
          {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-soft text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">School</th>
                <th className="px-4 py-3 text-left">View</th>
                <th className="px-4 py-3 text-left">Age</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Flags</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!filtered ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No classes found.</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="hover:bg-surface-soft/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.title}</p>
                    <p className="font-mono text-[11px] text-muted-foreground" title={c.id}>ID: {c.id.slice(0, 8)}…</p>
                    {c.approval_status === "pending" && <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">Pending approval</span>}
                    {c.approval_status === "rejected" && <span className="mt-1 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">Rejected</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.schools?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{views.find((v) => v.id === c.view_id)?.name ?? "—"}</td>
                  <td className="px-4 py-3">{c.age_min}–{c.age_max}</td>
                  <td className="px-4 py-3">{c.price_from > 0 ? `from ${c.price_from}` : "Free"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(c.id, "is_visible", !!c.is_visible)} className={`mr-1 inline-flex h-7 w-7 items-center justify-center rounded-lg ${c.is_visible ? "bg-emerald-100 text-emerald-700" : "text-muted-foreground hover:bg-surface-soft"}`} title={c.is_visible ? "Visible on site" : "Hidden"}>{c.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button>
                    <button onClick={() => toggle(c.id, "is_featured", !!c.is_featured)} className={`mr-1 inline-flex h-7 w-7 items-center justify-center rounded-lg ${c.is_featured ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-surface-soft"}`} title="Featured"><Star className="h-3.5 w-3.5" /></button>
                    <button onClick={() => toggle(c.id, "is_new", !!c.is_new)} className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${c.is_new ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-soft"}`} title="New"><Sparkles className="h-3.5 w-3.5" /></button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing(c)} className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-primary/20"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(c.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <ClassEditorModal cls={editing as ClassEditable} schools={schools} views={views} cats={cats} subs={subs} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}
