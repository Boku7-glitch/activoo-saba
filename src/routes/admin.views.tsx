import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/views")({
  component: AdminViews,
});

interface ViewRow {
  id: string;
  slug: string;
  name: string;
  icon: string;
  accent_hex: string;
  accent_secondary_hex: string;
  sort_order: number;
  is_active: boolean;
}

interface CategoryRow {
  id: string;
  view_id: string;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
}

interface SubRow {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  sort_order: number;
}

interface FilterRow {
  id: string;
  view_id: string;
  filter_type: "age" | "district" | "price" | "subcategory";
  is_enabled: boolean;
}

const FILTER_TYPES: FilterRow["filter_type"][] = ["subcategory", "age", "district", "price"];

function AdminViews() {
  const [tab, setTab] = useState<"views" | "categories" | "filters">("views");
  const [views, setViews] = useState<ViewRow[]>([]);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [filters, setFilters] = useState<FilterRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [v, c, s, f] = await Promise.all([
      supabase.from("views").select("*").order("sort_order"),
      supabase.from("view_categories").select("*").order("sort_order"),
      supabase.from("view_subcategories").select("*").order("sort_order"),
      supabase.from("view_filters").select("*"),
    ]);
    setViews((v.data as ViewRow[] | null) ?? []);
    setCats((c.data as CategoryRow[] | null) ?? []);
    setSubs((s.data as SubRow[] | null) ?? []);
    setFilters((f.data as FilterRow[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Views & categories</h1>
        <p className="text-sm text-muted-foreground">Manage the 4 main site sections, their colors, categories and filters.</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(["views", "categories", "filters"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-semibold capitalize transition",
              tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "views" && <ViewsTab views={views} onChange={refresh} />}
      {tab === "categories" && <CategoriesTab views={views} cats={cats} subs={subs} onChange={refresh} />}
      {tab === "filters" && <FiltersTab views={views} filters={filters} onChange={refresh} />}
    </div>
  );
}

/* ---------------- Views tab ---------------- */
function ViewsTab({ views, onChange }: { views: ViewRow[]; onChange: () => void }) {
  const [drafts, setDrafts] = useState<Record<string, ViewRow>>({});

  useEffect(() => {
    const m: Record<string, ViewRow> = {};
    views.forEach((v) => { m[v.id] = v; });
    setDrafts(m);
  }, [views]);

  const update = (id: string, patch: Partial<ViewRow>) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  const save = async (v: ViewRow) => {
    const { error } = await supabase.from("views").update({
      name: v.name, icon: v.icon, accent_hex: v.accent_hex, accent_secondary_hex: v.accent_secondary_hex,
      sort_order: v.sort_order, is_active: v.is_active, slug: v.slug,
    }).eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onChange();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this view? All its categories will also be deleted.")) return;
    const { error } = await supabase.from("views").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onChange();
  };

  const add = async () => {
    const { error } = await supabase.from("views").insert({
      slug: `view-${Date.now()}`, name: "New view", icon: "Sparkles",
      accent_hex: "#005DFF", accent_secondary_hex: "#818AFA",
      sort_order: views.length + 1,
    });
    if (error) return toast.error(error.message);
    onChange();
  };

  return (
    <div className="space-y-3">
      {Object.values(drafts).map((v) => (
        <div key={v.id} className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
          <div className="grid gap-3 md:grid-cols-6">
            <Field label="Name"><input value={v.name} onChange={(e) => update(v.id, { name: e.target.value })} className={inp} /></Field>
            <Field label="Slug"><input value={v.slug} onChange={(e) => update(v.id, { slug: e.target.value })} className={inp} /></Field>
            <Field label="Icon (lucide)"><input value={v.icon} onChange={(e) => update(v.id, { icon: e.target.value })} className={inp} placeholder="Sparkles" /></Field>
            <Field label="Accent">
              <div className="flex gap-1">
                <input type="color" value={v.accent_hex} onChange={(e) => update(v.id, { accent_hex: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-border" />
                <input value={v.accent_hex} onChange={(e) => update(v.id, { accent_hex: e.target.value })} className={inp} />
              </div>
            </Field>
            <Field label="Accent 2">
              <div className="flex gap-1">
                <input type="color" value={v.accent_secondary_hex} onChange={(e) => update(v.id, { accent_secondary_hex: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-border" />
                <input value={v.accent_secondary_hex} onChange={(e) => update(v.id, { accent_secondary_hex: e.target.value })} className={inp} />
              </div>
            </Field>
            <Field label="Order"><input type="number" value={v.sort_order} onChange={(e) => update(v.id, { sort_order: Number(e.target.value) })} className={inp} /></Field>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={v.is_active} onChange={(e) => update(v.id, { is_active: e.target.checked })} />
              Active
            </label>
            <div className="flex gap-2">
              <div className="h-6 w-24 rounded-full" style={{ background: `linear-gradient(135deg, ${v.accent_hex}, ${v.accent_secondary_hex})` }} />
              <button onClick={() => save(v)} className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-bold text-background"><Save className="h-3.5 w-3.5" /> Save</button>
              <button onClick={() => del(v.id)} className="rounded-xl bg-destructive/10 p-2 text-destructive hover:bg-destructive/20"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      ))}
      <button onClick={add} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/30">
        <Plus className="h-4 w-4" /> Add view
      </button>
    </div>
  );
}

/* ---------------- Categories tab ---------------- */
function CategoriesTab({ views, cats, subs, onChange }: { views: ViewRow[]; cats: CategoryRow[]; subs: SubRow[]; onChange: () => void }) {
  const [viewId, setViewId] = useState<string>(views[0]?.id ?? "");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => { if (!viewId && views[0]) setViewId(views[0].id); }, [views, viewId]);

  const viewCats = cats.filter((c) => c.view_id === viewId);

  const addCat = async () => {
    const { error } = await supabase.from("view_categories").insert({
      view_id: viewId, slug: `cat-${Date.now()}`, name: "New category", icon: "✨", sort_order: viewCats.length + 1,
    });
    if (error) return toast.error(error.message);
    onChange();
  };

  const saveCat = async (c: CategoryRow) => {
    const { error } = await supabase.from("view_categories").update({
      slug: c.slug, name: c.name, icon: c.icon, sort_order: c.sort_order,
    }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onChange();
  };

  const delCat = async (id: string) => {
    if (!confirm("Delete this category and all its subcategories?")) return;
    await supabase.from("view_categories").delete().eq("id", id);
    onChange();
  };

  const addSub = async (catId: string) => {
    const count = subs.filter((s) => s.category_id === catId).length;
    await supabase.from("view_subcategories").insert({
      category_id: catId, slug: `sub-${Date.now()}`, name: "New subcategory", sort_order: count + 1,
    });
    onChange();
  };

  const saveSub = async (s: SubRow) => {
    const { error } = await supabase.from("view_subcategories").update({
      slug: s.slug, name: s.name, sort_order: s.sort_order,
    }).eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onChange();
  };

  const delSub = async (id: string) => {
    if (!confirm("Delete this subcategory?")) return;
    await supabase.from("view_subcategories").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">View</label>
        <select value={viewId} onChange={(e) => setViewId(e.target.value)} className={`${inp} max-w-xs`}>
          {views.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {viewCats.map((c) => {
          const isOpen = !!open[c.id];
          const catSubs = subs.filter((s) => s.category_id === c.id);
          return (
            <div key={c.id} className="rounded-2xl border border-border bg-surface shadow-soft">
              <div className="flex items-center gap-2 p-3">
                <button onClick={() => setOpen((o) => ({ ...o, [c.id]: !isOpen }))} className="text-muted-foreground">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <input defaultValue={c.icon} onBlur={(e) => saveCat({ ...c, icon: e.target.value })} className={`${inp} w-14 text-center`} />
                <input defaultValue={c.name} onBlur={(e) => saveCat({ ...c, name: e.target.value })} className={`${inp} flex-1`} />
                <input defaultValue={c.slug} onBlur={(e) => saveCat({ ...c, slug: e.target.value })} className={`${inp} w-32`} />
                <input type="number" defaultValue={c.sort_order} onBlur={(e) => saveCat({ ...c, sort_order: Number(e.target.value) })} className={`${inp} w-16`} />
                <button onClick={() => delCat(c.id)} className="rounded-xl bg-destructive/10 p-2 text-destructive hover:bg-destructive/20"><Trash2 className="h-4 w-4" /></button>
              </div>
              {isOpen && (
                <div className="space-y-2 border-t border-border bg-muted/20 p-3 pl-10">
                  {catSubs.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <input defaultValue={s.name} onBlur={(e) => saveSub({ ...s, name: e.target.value })} className={`${inp} flex-1`} />
                      <input defaultValue={s.slug} onBlur={(e) => saveSub({ ...s, slug: e.target.value })} className={`${inp} w-32`} />
                      <input type="number" defaultValue={s.sort_order} onBlur={(e) => saveSub({ ...s, sort_order: Number(e.target.value) })} className={`${inp} w-16`} />
                      <button onClick={() => delSub(s.id)} className="rounded-xl bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => addSub(c.id)} className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted">
                    <Plus className="h-3.5 w-3.5" /> Add subcategory
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={addCat} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/30">
          <Plus className="h-4 w-4" /> Add category
        </button>
      </div>
    </div>
  );
}

/* ---------------- Filters tab ---------------- */
function FiltersTab({ views, filters, onChange }: { views: ViewRow[]; filters: FilterRow[]; onChange: () => void }) {
  const [viewId, setViewId] = useState<string>(views[0]?.id ?? "");

  useEffect(() => { if (!viewId && views[0]) setViewId(views[0].id); }, [views, viewId]);

  const toggle = async (filterType: FilterRow["filter_type"], enabled: boolean) => {
    const existing = filters.find((f) => f.view_id === viewId && f.filter_type === filterType);
    if (existing) {
      await supabase.from("view_filters").update({ is_enabled: enabled }).eq("id", existing.id);
    } else {
      await supabase.from("view_filters").insert({ view_id: viewId, filter_type: filterType, is_enabled: enabled });
    }
    onChange();
  };

  const isOn = (ft: string) => filters.find((f) => f.view_id === viewId && f.filter_type === ft)?.is_enabled ?? false;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">View</label>
        <select value={viewId} onChange={(e) => setViewId(e.target.value)} className={`${inp} max-w-xs`}>
          {views.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
        <p className="mb-3 text-xs text-muted-foreground">Choose which filters appear in the search/listing for this view.</p>
        <div className="space-y-2">
          {FILTER_TYPES.map((ft) => (
            <label key={ft} className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5">
              <span className="text-sm font-semibold capitalize">{ft}</span>
              <input type="checkbox" checked={isOn(ft)} onChange={(e) => toggle(ft, e.target.checked)} className="h-5 w-5" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/* helpers */
const inp = "h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
