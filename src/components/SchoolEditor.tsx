import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploader } from "@/components/ImageUploader";
import { AddressMapPicker } from "@/components/AddressMapPicker";
import { useLocations } from "@/lib/locations";
import { AutoTranslateButton, BilingualField } from "@/components/AutoTranslate";
import { missingRequired, useRequiredFields } from "@/lib/required-fields";
import { WorkingHoursEditor } from "@/components/WorkingHoursEditor";
import { ImageUploadNotice } from "@/components/ImageUploadNotice";


export interface SchoolEditable {
  id?: string;
  slug?: string;
  name?: string;
  name_en?: string | null;
  district?: string;
  description?: string | null;
  description_en?: string | null;
  about?: string | null;
  about_en?: string | null;
  city?: string | null;
  city_en?: string | null;
  address?: string | null;
  address_en?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  working_hours?: string | null;
  image_url?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  verified?: boolean;
  social_links?: Record<string, string> | null;
  lat?: number | null;
  lng?: number | null;
  owner_id?: string | null;
}

export function SchoolEditorModal({
  school,
  onClose,
  onSaved,
  ownerScoped = false,
  allowVerifiedEdit = true,
}: {
  school: SchoolEditable;
  onClose: () => void;
  onSaved: () => void;
  /** When true, insert sets owner_id = current user */
  ownerScoped?: boolean;
  /** Hide "Verified" toggle for non-admins */
  allowVerifiedEdit?: boolean;
}) {
  const [form, setForm] = useState<SchoolEditable>(school);
  const [saving, setSaving] = useState(false);
  const isNew = !school.id;
  const { requiredKeys, isRequired, mark } = useRequiredFields("school");

  const save = async () => {
    const missing = missingRequired("school", requiredKeys, {
      name: form.name,
      name_en: form.name_en,
      district: form.district,
      city: form.city,
      address: form.address,
      phone: form.phone,
      email: form.email,
      website: form.website,
      working_hours: form.working_hours,
      description: form.description,
      about: form.about,
      logo_url: form.logo_url || form.image_url,
      cover_image_url: form.cover_image_url,
    });
    if (missing.length > 0) return toast.error(`Please fill required fields: ${missing.join(", ")}`);
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: form.name,
      name_en: form.name_en || null,
      district: form.district,
      description: form.description || null,
      description_en: form.description_en || null,
      about: form.about || null,
      about_en: form.about_en || null,
      city: form.city || null,
      city_en: form.city_en || null,
      address: form.address || null,
      address_en: form.address_en || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      working_hours: form.working_hours || null,
      image_url: form.image_url || null,
      logo_url: form.logo_url || null,
      cover_image_url: form.cover_image_url || null,
      social_links: (form.social_links ?? {}) as Record<string, string>,
      lat: form.lat ?? null,
      lng: form.lng ?? null,
    };
    if (allowVerifiedEdit) payload.verified = !!form.verified;
    if (isNew) payload.is_visible = false; // stays hidden until explicitly published
    if (isNew && ownerScoped) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        payload.owner_id = userData.user.id;
        // RLS requires the "school" role to insert a school
        const { data: existing } = await supabase
          .from("user_roles").select("id").eq("user_id", userData.user.id).eq("role", "school").maybeSingle();
        if (!existing) await supabase.from("user_roles").insert({ user_id: userData.user.id, role: "school" });
      }
    }

    const { error } = isNew
      ? await supabase.from("schools").insert(payload as never)
      : await supabase.from("schools").update(payload as never).eq("id", school.id!);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isNew ? "School created" : "School updated");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur md:items-center md:p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-elevated md:rounded-3xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{isNew ? "New school" : "Edit school"}</h2>
          <div className="flex items-center gap-2">
            <AutoTranslateButton
              pairs={() => [
                { source: form.name, value: form.name_en, apply: (v) => setForm((f) => ({ ...f, name_en: v })) },
                { source: form.description, value: form.description_en, apply: (v) => setForm((f) => ({ ...f, description_en: v })) },
                { source: form.about, value: form.about_en, apply: (v) => setForm((f) => ({ ...f, about_en: v })) },
                { source: form.address, value: form.address_en, apply: (v) => setForm((f) => ({ ...f, address_en: v })) },
              ]}
            />
            <button onClick={onClose} className="rounded-full p-1 hover:bg-surface-soft"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <BilingualField
            label="Name"
            required
            ka={form.name || ""}
            en={form.name_en || ""}
            onKa={(v) => setForm({ ...form, name: v })}
            onEn={(v) => setForm({ ...form, name_en: v })}
          />

          <CityDistrictPicker
            city={form.city || ""}
            district={form.district || ""}
            onChange={(v) => setForm({ ...form, city: v.city, city_en: v.city_en, district: v.district })}
          />

          <Field label={mark("phone", "Phone")} value={form.phone || ""} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label={mark("email", "Email")} value={form.email || ""} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label={mark("website", "Website")} value={form.website || ""} onChange={(v) => setForm({ ...form, website: v })} />
          <div className="md:col-span-2">
            <WorkingHoursEditor
              label={mark("working_hours", "Working hours")}
              value={form.working_hours}
              onChange={(v) => setForm({ ...form, working_hours: v })}
            />
          </div>
          <Field label="Instagram URL" value={(form.social_links?.instagram) || ""} onChange={(v) => setForm({ ...form, social_links: { ...(form.social_links ?? {}), instagram: v } })} />
          <Field label="WhatsApp (number or link)" value={(form.social_links?.whatsapp) || ""} onChange={(v) => setForm({ ...form, social_links: { ...(form.social_links ?? {}), whatsapp: v } })} />
          <Field label="Facebook URL" value={(form.social_links?.facebook) || ""} onChange={(v) => setForm({ ...form, social_links: { ...(form.social_links ?? {}), facebook: v } })} />
          <Field label="TikTok URL" value={(form.social_links?.tiktok) || ""} onChange={(v) => setForm({ ...form, social_links: { ...(form.social_links ?? {}), tiktok: v } })} />
          {allowVerifiedEdit && (
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" checked={!!form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
              <span className="text-sm font-semibold">Verified school (badge shown on profile)</span>
            </label>
          )}
          <BilingualField
            label="Short description"
            required={isRequired("description")}
            multiline
            ka={form.description || ""}
            en={form.description_en || ""}
            onKa={(v) => setForm({ ...form, description: v })}
            onEn={(v) => setForm({ ...form, description_en: v })}
          />
          <BilingualField
            label="About the school"
            required={isRequired("about")}
            multiline
            ka={form.about || ""}
            en={form.about_en || ""}
            onKa={(v) => setForm({ ...form, about: v })}
            onEn={(v) => setForm({ ...form, about_en: v })}
          />
          <BilingualField
            label="Address text"
            required={isRequired("address")}
            ka={form.address || ""}
            en={form.address_en || ""}
            onKa={(v) => setForm({ ...form, address: v })}
            onEn={(v) => setForm({ ...form, address_en: v })}
          />

          <div>
            <ImageUploader label={mark("logo_url", "Logo")} folder="schools" value={form.logo_url || form.image_url || null} onChange={(url) => setForm({ ...form, logo_url: url })} />
          </div>
          <div>
            <ImageUploader label={mark("cover_image_url", "Cover image")} folder="schools" value={form.cover_image_url || null} onChange={(url) => setForm({ ...form, cover_image_url: url })} />
          </div>
          <div className="md:col-span-2">
            <ImageUploadNotice />
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

export function CityDistrictPicker({
  city,
  district,
  onChange,
}: {
  city: string;
  district: string;
  onChange: (v: { city: string; city_en: string | null; district: string }) => void;
}) {
  const { cities, districts } = useLocations();
  const selectedCity = cities.find((c) => c.name === city || c.name_en === city);
  const cityDistricts = districts.filter((d) => d.city_id === selectedCity?.id);
  const known = !city || !!selectedCity;

  return (
    <>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold">City</span>
        <select
          value={selectedCity?.id ?? ""}
          onChange={(e) => {
            const c = cities.find((x) => x.id === e.target.value);
            onChange({ city: c ? c.name : "", city_en: c?.name_en ?? null, district: "" });
          }}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        >
          <option value="">{known ? "— Select city —" : city}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name_en || c.name}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold">District *</span>
        <select
          value={cityDistricts.some((d) => d.name === district || d.name_en === district) ? district : ""}
          onChange={(e) => onChange({ city: selectedCity?.name ?? city, city_en: selectedCity?.name_en ?? null, district: e.target.value })}
          disabled={!selectedCity}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
        >
          <option value="">{district && !selectedCity ? district : selectedCity ? "— Select district —" : "Select a city first"}</option>
          {cityDistricts.filter((d) => !d.parent_id).map((d) => (
            <optgroup key={d.id} label={d.name_en || d.name}>
              <option value={d.name_en || d.name}>{d.name_en || d.name}</option>
              {cityDistricts.filter((sd) => sd.parent_id === d.id).map((sd) => (
                <option key={sd.id} value={sd.name_en || sd.name}>&nbsp;&nbsp;{sd.name_en || sd.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </>
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
