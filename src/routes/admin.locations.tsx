import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { useLocations, slugify, type CityRow, type DistrictRow } from "@/lib/locations";
import { TranslateInline } from "@/components/AutoTranslate";


export const Route = createFileRoute("/admin/locations")({
  component: AdminLocations,
});

const inp = "h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary";

function AdminLocations() {
  const { cities, districts, loading, refresh } = useLocations(true);
  const [cityId, setCityId] = useState<string>("");

  useEffect(() => {
    if (!cityId && cities[0]) setCityId(cities[0].id);
  }, [cities, cityId]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const cityDistricts = districts.filter((d) => d.city_id === cityId);
  const topLevel = cityDistricts.filter((d) => !d.parent_id);
  const childrenOf = (id: string) => cityDistricts.filter((d) => d.parent_id === id);

  const addCity = async () => {
    const { error } = await supabase.from("cities").insert({
      slug: `city-${Date.now()}`,
      name: "ახალი ქალაქი",
      name_en: "New city",
      sort_order: cities.length + 1,
    });
    if (error) return toast.error(error.message);
    refresh();
  };

  const saveCity = async (c: CityRow) => {
    const { error } = await supabase
      .from("cities")
      .update({ name: c.name, name_en: c.name_en, slug: c.slug || slugify(c.name_en || c.name), sort_order: c.sort_order, is_active: c.is_active })
      .eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    refresh();
  };

  const delCity = async (id: string) => {
    if (!confirm("Delete this city and all of its districts?")) return;
    const { error } = await supabase.from("cities").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (cityId === id) setCityId("");
    refresh();
  };

  const addDistrict = async (parentId: string | null = null) => {
    if (!cityId) return;
    const { error } = await supabase.from("districts").insert({
      city_id: cityId,
      parent_id: parentId,
      slug: `district-${Date.now()}`,
      name: parentId ? "ახალი უბანი" : "ახალი რაიონი",
      name_en: parentId ? "New sub-district" : "New district",
      sort_order: (parentId ? childrenOf(parentId).length : topLevel.length) + 1,
    });
    if (error) return toast.error(error.message);
    refresh();
  };

  const saveDistrict = async (d: DistrictRow) => {
    const { error } = await supabase
      .from("districts")
      .update({ name: d.name, name_en: d.name_en, slug: d.slug || slugify(d.name_en || d.name), sort_order: d.sort_order, is_active: d.is_active })
      .eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    refresh();
  };

  const delDistrict = async (id: string) => {
    if (!confirm("Delete this district and its sub-districts?")) return;
    const { error } = await supabase.from("districts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cities & districts</h1>
        <p className="text-sm text-muted-foreground">Manage the location directory used in school and club forms.</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Cities</h2>
        {cities.map((c) => (
          <CityRowEditor key={c.id} city={c} onSave={saveCity} onDelete={delCity} />
        ))}
        <button onClick={addCity} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/30">
          <Plus className="h-4 w-4" /> Add city
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Districts</h2>
        <select value={cityId} onChange={(e) => setCityId(e.target.value)} className={`${inp} max-w-xs`}>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name_en || c.name}</option>
          ))}
        </select>
        {topLevel.map((d) => (
          <div key={d.id} className="space-y-2">
            <DistrictRowEditor district={d} onSave={saveDistrict} onDelete={delDistrict} />
            <div className="ml-6 space-y-2 border-l-2 border-dashed border-border pl-4">
              {childrenOf(d.id).map((sd) => (
                <DistrictRowEditor key={sd.id} district={sd} onSave={saveDistrict} onDelete={delDistrict} />
              ))}
              <button onClick={() => addDistrict(d.id)} className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/30">
                <Plus className="h-3.5 w-3.5" /> Add sub-district
              </button>
            </div>
          </div>
        ))}
        <button onClick={() => addDistrict(null)} disabled={!cityId} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/30 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Add district
        </button>
      </section>
    </div>
  );
}

function CityRowEditor({ city, onSave, onDelete }: { city: CityRow; onSave: (c: CityRow) => void; onDelete: (id: string) => void }) {
  const [draft, setDraft] = useState(city);
  useEffect(() => setDraft(city), [city]);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 shadow-soft">
      <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name (KA)" className={`${inp} flex-1 min-w-[140px]`} />
      <input value={draft.name_en ?? ""} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })} placeholder="Name (EN)" className={`${inp} flex-1 min-w-[140px]`} />
      <TranslateInline source={draft.name} onResult={(t) => setDraft({ ...draft, name_en: t })} />

      <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="slug" className={`${inp} w-32`} />
      <input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} className={`${inp} w-16`} />
      <label className="flex items-center gap-1.5 text-xs font-semibold">
        <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /> Active
      </label>
      <button onClick={() => onSave(draft)} className="flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-xs font-bold text-background"><Save className="h-3.5 w-3.5" /> Save</button>
      <button onClick={() => onDelete(city.id)} className="rounded-xl bg-destructive/10 p-2 text-destructive hover:bg-destructive/20"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function DistrictRowEditor({ district, onSave, onDelete }: { district: DistrictRow; onSave: (d: DistrictRow) => void; onDelete: (id: string) => void }) {
  const [draft, setDraft] = useState(district);
  useEffect(() => setDraft(district), [district]);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 shadow-soft">
      <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name (KA)" className={`${inp} flex-1 min-w-[140px]`} />
      <input value={draft.name_en ?? ""} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })} placeholder="Name (EN)" className={`${inp} flex-1 min-w-[140px]`} />
      <TranslateInline source={draft.name} onResult={(t) => setDraft({ ...draft, name_en: t })} />

      <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="slug" className={`${inp} w-32`} />
      <input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} className={`${inp} w-16`} />
      <label className="flex items-center gap-1.5 text-xs font-semibold">
        <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /> Active
      </label>
      <button onClick={() => onSave(draft)} className="flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-xs font-bold text-background"><Save className="h-3.5 w-3.5" /> Save</button>
      <button onClick={() => onDelete(district.id)} className="rounded-xl bg-destructive/10 p-2 text-destructive hover:bg-destructive/20"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
