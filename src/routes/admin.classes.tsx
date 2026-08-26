import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Star, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_KEYS, CATEGORIES, type CategoryKey } from "@/lib/categories";
import { ImageUploader, GalleryUploader } from "@/components/ImageUploader";

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
      supabase.from("classes").select("*, schools(name)").order("created_at", { ascending: false }),
      supabase.from("schools").select("id,name").order("name"),
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
    if (!confirm("Delete this class?")) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Class deleted");
    load();
  };

  const filtered = rows?.filter((c) =>
    (!search || c.title.toLowerCase().includes(search.toLowerCase())) &&
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
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="h-11 w-full max-w-xs rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary" />
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
                  <td className="px-4 py-3 font-medium">{c.title}</td>
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

      {editing && <ClassModal cls={editing} schools={schools} views={views} cats={cats} subs={subs} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function ClassModal({ cls, schools, views, cats, subs, onClose, onSaved }: {
  cls: Partial<ClassRow>; schools: SchoolOption[]; views: ViewOption[]; cats: CatOption[]; subs: SubOption[];
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<ClassRow>>({
    ...cls,
    formats: cls.formats?.length ? cls.formats : (cls.format ? [cls.format] : ["group"]),
    category_ids: cls.category_ids ?? [],
    subcategory_ids: cls.subcategory_ids ?? (cls.subcategory_id ? [cls.subcategory_id] : []),
    schedule_days: cls.schedule_days ?? [],
    is_visible: cls.is_visible ?? true,
  });
  const [saving, setSaving] = useState(false);
  const isNew = !cls.id;

  const viewCats = useMemo(() => cats.filter((c) => c.view_id === form.view_id), [cats, form.view_id]);
  const selectedCatIds = form.category_ids ?? [];
  const activeCats = useMemo(
    () => (selectedCatIds.length ? viewCats.filter((c) => selectedCatIds.includes(c.id)) : viewCats),
    [viewCats, selectedCatIds],
  );
  const viewSubs = useMemo(() => {
    const ids = new Set(activeCats.map((c) => c.id));
    return subs.filter((s) => ids.has(s.category_id));
  }, [subs, activeCats]);

  const toggleArr = <T,>(arr: T[] | null | undefined, v: T) => {
    const a = arr ?? [];
    return a.includes(v) ? a.filter((x) => x !== v) : [...a, v];
  };

  const save = async () => {
    if (!form.title || !form.school_id) return toast.error("Title and school are required");
    if (!form.formats || form.formats.length === 0) return toast.error("Choose at least one format");
    setSaving(true);
    const payload: any = {
      title: form.title!,
      school_id: form.school_id!,
      category: (form.category || "creativity") as CategoryKey,
      view_id: form.view_id || null,
      subcategory_id: form.subcategory_ids?.[0] ?? null,
      category_ids: form.category_ids ?? [],
      subcategory_ids: form.subcategory_ids ?? [],
      description: form.description || null,
      age_min: Number(form.age_min) || 3,
      age_max: Number(form.age_max) || 14,
      price_from: Number(form.price_from) || 0,
      format: (form.formats?.[0] || "group") as "group" | "individual",
      formats: form.formats ?? [],
      schedule_days: form.schedule_days ?? [],
      is_visible: !!form.is_visible,
      language: form.language || "English",
      schedule: form.schedule || null,
      image_url: form.image_url || null,
      gallery: form.gallery ?? [],
      benefits: form.benefits ?? [],
      is_featured: !!form.is_featured,
      is_new: !!form.is_new,
    };
    const { error } = isNew
      ? await supabase.from("classes").insert(payload)
      : await supabase.from("classes").update(payload).eq("id", cls.id!);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isNew ? "Class created" : "Class updated");
    onSaved();
  };

  const benefitsText = (form.benefits ?? []).join("\n");
  const schedule = form.schedule_days ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur md:items-center md:p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-elevated md:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{isNew ? "New class" : "Edit class"}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-surface-soft"><X className="h-5 w-5" /></button>
        </div>

        {/* Visibility highlight */}
        <label className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-surface-soft p-3 text-sm">
          <input type="checkbox" checked={!!form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} className="h-4 w-4 rounded" />
          <div>
            <div className="font-semibold">Show on site</div>
            <div className="text-xs text-muted-foreground">When off, the class is hidden from the public site.</div>
          </div>
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Title" value={form.title || ""} onChange={(v) => setForm({ ...form, title: v })} />
          <Select label="School" value={form.school_id || ""} onChange={(v) => setForm({ ...form, school_id: v })} options={schools.map((s) => ({ value: s.id, label: s.name }))} />

          <Select
            label="Main view (Education / Activity / Masterclasses / Services)"
            value={form.view_id || ""}
            onChange={(v) => setForm({ ...form, view_id: v, category_ids: [], subcategory_ids: [] })}
            options={[{ value: "", label: "— Select —" }, ...views.map((v) => ({ value: v.id, label: v.name }))]}
          />
          <Select label="Legacy category" value={form.category || "creativity"} onChange={(v) => setForm({ ...form, category: v as CategoryKey })} options={CATEGORY_KEYS.map((k) => ({ value: k, label: `${CATEGORIES[k].emoji} ${CATEGORIES[k].label}` }))} />

          {/* Categories multi */}
          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold">Categories (pick one or several)</span>
            {!form.view_id ? (
              <p className="rounded-xl bg-surface-soft p-3 text-xs text-muted-foreground">Pick a main view first to see categories.</p>
            ) : viewCats.length === 0 ? (
              <p className="rounded-xl bg-surface-soft p-3 text-xs text-muted-foreground">No categories defined for this view.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {viewCats.map((cat) => {
                  const on = selectedCatIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        const nextCats = toggleArr(form.category_ids, cat.id);
                        // Drop subcategories whose category was deselected
                        const allowedSubIds = new Set(
                          subs.filter((s) => nextCats.includes(s.category_id)).map((s) => s.id),
                        );
                        const nextSubs = nextCats.length
                          ? (form.subcategory_ids ?? []).filter((id) => allowedSubIds.has(id))
                          : (form.subcategory_ids ?? []);
                        setForm({ ...form, category_ids: nextCats, subcategory_ids: nextSubs });
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${on ? "bg-foreground text-background" : "bg-surface-soft hover:bg-muted"}`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subcategories multi */}
          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold">Subcategories (pick one or several)</span>
            {!form.view_id ? (
              <p className="rounded-xl bg-surface-soft p-3 text-xs text-muted-foreground">Pick a main view first to see subcategories.</p>
            ) : viewSubs.length === 0 ? (
              <p className="rounded-xl bg-surface-soft p-3 text-xs text-muted-foreground">{selectedCatIds.length ? "No subcategories in the selected categories." : "No subcategories defined for this view."}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeCats.map((cat) => {
                  const catSubs = viewSubs.filter((s) => s.category_id === cat.id);
                  if (catSubs.length === 0) return null;
                  return (
                    <div key={cat.id} className="rounded-xl border border-border bg-background p-2">
                      <div className="mb-1 px-1 text-[10px] font-bold uppercase text-muted-foreground">{cat.name}</div>
                      <div className="flex flex-wrap gap-1">
                        {catSubs.map((s) => {
                          const on = (form.subcategory_ids ?? []).includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setForm({ ...form, subcategory_ids: toggleArr(form.subcategory_ids, s.id) })}
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${on ? "bg-foreground text-background" : "bg-surface-soft hover:bg-muted"}`}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formats multi */}
          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold">Format (one or both)</span>
            <div className="flex gap-2">
              {(["group", "individual"] as const).map((f) => {
                const on = (form.formats ?? []).includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setForm({ ...form, formats: toggleArr(form.formats, f) })}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize ${on ? "bg-foreground text-background" : "bg-surface-soft hover:bg-muted"}`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Min age" type="number" value={String(form.age_min ?? 3)} onChange={(v) => setForm({ ...form, age_min: Number(v) })} />
          <Field label="Max age" type="number" value={String(form.age_max ?? 14)} onChange={(v) => setForm({ ...form, age_max: Number(v) })} />
          <Field label="Price from (0 = free)" type="number" value={String(form.price_from ?? 0)} onChange={(v) => setForm({ ...form, price_from: Number(v) })} />
          <Field label="Language" value={form.language || "English"} onChange={(v) => setForm({ ...form, language: v })} />

          {/* Schedule per day */}
          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold">Weekly schedule</span>
            <div className="space-y-2">
              {schedule.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={row.day}
                    onChange={(e) => {
                      const next = [...schedule]; next[i] = { ...row, day: e.target.value as Day };
                      setForm({ ...form, schedule_days: next });
                    }}
                    className="h-10 w-28 rounded-xl border border-border bg-background px-2 text-sm"
                  >
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input
                    placeholder="16:00–17:30"
                    value={row.time}
                    onChange={(e) => {
                      const next = [...schedule]; next[i] = { ...row, time: e.target.value };
                      setForm({ ...form, schedule_days: next });
                    }}
                    className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, schedule_days: schedule.filter((_, j) => j !== i) })}
                    className="rounded-xl px-3 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, schedule_days: [...schedule, { day: "Mon", time: "" }] })}
                className="flex items-center gap-1 rounded-xl bg-surface-soft px-3 py-1.5 text-xs font-bold hover:bg-muted"
              >
                <Plus className="h-3 w-3" /> Add day
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <Field label="Description" value={form.description || ""} onChange={(v) => setForm({ ...form, description: v })} multiline />
          </div>
          <div className="md:col-span-2">
            <Field label="Benefits (one per line)" value={benefitsText} multiline onChange={(v) => setForm({ ...form, benefits: v.split("\n").map((s) => s.trim()).filter(Boolean) })} />
          </div>
          <div className="md:col-span-2">
            <ImageUploader label="Cover image" folder="classes" value={form.image_url || null} onChange={(url) => setForm({ ...form, image_url: url })} />
          </div>
          <div className="md:col-span-2">
            <GalleryUploader value={form.gallery ?? []} folder="classes-gallery" onChange={(urls) => setForm({ ...form, gallery: urls })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4 rounded" />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} className="h-4 w-4 rounded" />
            Mark as new
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-surface-soft">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-xl bg-foreground px-5 py-2 text-sm font-bold text-background disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline, type = "text" }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
      )}
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
