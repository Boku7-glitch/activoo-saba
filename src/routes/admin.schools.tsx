import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ImageUploader";
import { AddressMapPicker } from "@/components/AddressMapPicker";

export const Route = createFileRoute("/admin/schools")({
  component: AdminSchools,
});

interface School {
  id: string;
  name: string;
  district: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  working_hours: string | null;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  review_count: number | null;
  owner_id: string | null;
  created_at: string;
}

function AdminSchools() {
  const [rows, setRows] = useState<School[] | null>(null);
  const [editing, setEditing] = useState<Partial<School> | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data, error } = await supabase.from("schools").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as School[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this school? All its classes will also be removed.")) return;
    const { error } = await supabase.from("schools").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("School deleted");
    load();
  };

  const filtered = rows?.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Schools</h1>
          <p className="text-sm text-muted-foreground">{rows?.length ?? 0} school(s) on the platform.</p>
        </div>
        <button
          onClick={() => setEditing({ name: "", district: "", description: "", address: "", phone: "" })}
          className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-bold text-background shadow-pop transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New school
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or district…"
        className="h-11 w-full max-w-sm rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-soft text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">District</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Map</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!filtered ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No schools found.</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} className="hover:bg-surface-soft/50">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      {s.image_url && <img src={s.image_url} alt="" className="h-8 w-8 rounded-lg object-cover" />}
                      {s.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">{s.district}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.lat != null && s.lng != null ? "📍 Pinned" : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing(s)} className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-primary/20"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(s.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <SchoolModal school={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function SchoolModal({ school, onClose, onSaved }: { school: Partial<School>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(school);
  const [saving, setSaving] = useState(false);
  const isNew = !school.id;

  const save = async () => {
    if (!form.name || !form.district) return toast.error("Name and district are required");
    setSaving(true);
    const payload = {
      name: form.name!,
      district: form.district!,
      description: form.description || null,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      working_hours: form.working_hours || null,
      image_url: form.image_url || null,
      lat: form.lat ?? null,
      lng: form.lng ?? null,
    };
    const { error } = isNew
      ? await supabase.from("schools").insert(payload)
      : await supabase.from("schools").update(payload).eq("id", school.id!);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isNew ? "School created" : "School updated");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur md:items-center md:p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-elevated md:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{isNew ? "New school" : "Edit school"}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-surface-soft"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Name *" value={form.name || ""} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="District *" value={form.district || ""} onChange={(v) => setForm({ ...form, district: v })} />
          <Field label="Phone" value={form.phone || ""} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Email" value={form.email || ""} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Website" value={form.website || ""} onChange={(v) => setForm({ ...form, website: v })} />
          <Field label="Working hours" value={form.working_hours || ""} onChange={(v) => setForm({ ...form, working_hours: v })} />
          <div className="md:col-span-2">
            <Field label="Description" value={form.description || ""} onChange={(v) => setForm({ ...form, description: v })} multiline />
          </div>
          <div className="md:col-span-2">
            <ImageUploader
              label="Cover image / logo"
              folder="schools"
              value={form.image_url || null}
              onChange={(url) => setForm({ ...form, image_url: url })}
            />
          </div>
          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold">Address & location on map</span>
            <AddressMapPicker
              address={form.address || ""}
              lat={form.lat ?? null}
              lng={form.lng ?? null}
              onChange={(v) => setForm({ ...form, address: v.address, lat: v.lat, lng: v.lng })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-surface-soft">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-xl bg-foreground px-5 py-2 text-sm font-bold text-background disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
      )}
    </label>
  );
}
