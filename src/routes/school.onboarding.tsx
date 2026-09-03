import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ImageUploader } from "@/components/ImageUploader";
import { AddressMapPicker } from "@/components/AddressMapPicker";
import { CityDistrictPicker } from "@/components/SchoolEditor";
import { WorkingHoursEditor } from "@/components/WorkingHoursEditor";
import {
  ClassEditorModal,
  type ClassEditable,
  type ViewOption,
  type CatOption,
  type SubOption,
} from "@/components/ClassEditor";

export const Route = createFileRoute("/school/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: "Create your school page — activoo" },
      { name: "description", content: "Register your school on activoo and publish your clubs for parents to discover." },
      { property: "og:title", content: "Create your school page — activoo" },
      { property: "og:description", content: "Register your school on activoo and publish your clubs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

interface SchoolForm {
  name: string;
  name_en: string;
  city: string;
  city_en: string | null;
  district: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  email: string;
  website: string;
  working_hours: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  whatsapp: string;
  description: string;
  description_en: string;
  about: string;
  about_en: string;
  logo_url: string | null;
  cover_image_url: string | null;
}

const empty: SchoolForm = {
  name: "", name_en: "", city: "", city_en: null, district: "", address: "",
  lat: null, lng: null, phone: "", email: "", website: "", working_hours: "",
  instagram: "", facebook: "", whatsapp: "", tiktok: "",
  description: "", description_en: "", about: "", about_en: "",
  logo_url: null, cover_image_url: null,
};

function OnboardingPage() {
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<SchoolForm>(empty);
  const [saving, setSaving] = useState(false);
  const [school, setSchool] = useState<{ id: string; slug: string; name: string } | null>(null);
  const [classes, setClasses] = useState<{ id: string; title: string }[]>([]);

  // class editor data
  const [editingClass, setEditingClass] = useState<ClassEditable | null>(null);
  const [views, setViews] = useState<ViewOption[]>([]);
  const [cats, setCats] = useState<CatOption[]>([]);
  const [subs, setSubs] = useState<SubOption[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  // If the user already has a school, send them to the dashboard
  useEffect(() => {
    if (!user || school) return;
    supabase.from("schools").select("id,slug,name").eq("owner_id", user.id).is("deleted_at", null).limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) navigate({ to: "/school/dashboard" });
      });
  }, [user, school, navigate]);

  useEffect(() => {
    Promise.all([
      supabase.from("views").select("id,name,slug").order("sort_order"),
      supabase.from("view_categories").select("id,name,view_id").order("sort_order"),
      supabase.from("view_subcategories").select("id,name,category_id").order("sort_order"),
    ]).then(([vw, vc, vs]) => {
      setViews((vw.data as ViewOption[]) ?? []);
      setCats((vc.data as CatOption[]) ?? []);
      setSubs((vs.data as SubOption[]) ?? []);
    });
  }, []);

  const createSchool = async () => {
    if (!user) return;
    if (!form.name.trim()) return toast.error("School name is required");
    if (!form.district) return toast.error("Please select city and district");
    setSaving(true);
    try {
      if (!roles.includes("school") && !roles.includes("admin")) {
        throw new Error("This account is registered as a regular user. Create a school account to publish a school.");
      }
      const social: Record<string, string> = {};
      if (form.instagram) social.instagram = form.instagram;
      if (form.facebook) social.facebook = form.facebook;
      if (form.whatsapp) social.whatsapp = form.whatsapp;
      if (form.tiktok) social.tiktok = form.tiktok;

      const { data, error } = await supabase.from("schools").insert({
        owner_id: user.id,
        name: form.name.trim(),
        name_en: form.name_en || null,
        city: form.city || null,
        city_en: form.city_en,
        district: form.district,
        address: form.address || null,
        lat: form.lat,
        lng: form.lng,
        phone: form.phone || null,
        email: form.email || null,
        website: form.website || null,
        working_hours: form.working_hours || null,
        description: form.description || null,
        description_en: form.description_en || null,
        about: form.about || null,
        about_en: form.about_en || null,
        logo_url: form.logo_url,
        cover_image_url: form.cover_image_url,
        social_links: social,
        is_visible: false,
      }).select("id,slug,name").single();
      if (error) throw error;
      setSchool(data as { id: string; slug: string; name: string });
      toast.success("School page created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the school");
    } finally {
      setSaving(false);
    }
  };

  const reloadClasses = async () => {
    if (!school) return;
    const { data } = await supabase.from("classes").select("id,title").eq("school_id", school.id)
      .is("deleted_at", null).order("created_at", { ascending: false });
    setClasses((data as { id: string; title: string }[]) ?? []);
  };

  if (!user) return <AppShell hideViewTabs><div className="p-10 text-center text-muted-foreground">Loading…</div></AppShell>;

  const canCreateSchool = roles.includes("school") || roles.includes("admin");
  if (!canCreateSchool) {
    return (
      <AppShell hideViewTabs>
        <div className="mx-auto max-w-lg px-5 py-16 text-center">
          <h1 className="text-2xl font-extrabold">This is a personal account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is registered as a regular user — you can search classes, save favourites and get replies from schools.
            Publishing a school requires a separate school account.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/profile" className="flex h-12 items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop">
              Go to my profile
            </Link>
            <Link to="/search" className="flex h-12 items-center justify-center rounded-2xl bg-surface-soft text-sm font-semibold">
              Browse classes
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ---------- Step 2: school created, add clubs ---------- */
  if (school) {
    return (
      <AppShell hideViewTabs>
        <div className="mx-auto max-w-2xl px-5 pb-24 pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-accent-strong" />
            <div>
              <h1 className="text-2xl font-extrabold">{school.name} is ready</h1>
              <p className="text-sm text-muted-foreground">It is still unpublished — preview it, then publish when everything looks right.</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {classes.map((c) => (
              <div key={c.id} className="rounded-2xl bg-surface p-3.5 font-semibold shadow-soft">{c.title}</div>
            ))}
          </div>

          <button
            onClick={() => setEditingClass({
              title: "", category: "creativity", age_min: 5, age_max: 12, price_from: 0,
              format: "group", formats: ["group"], schedule_days: [], category_ids: [],
              subcategory_ids: [], is_visible: true, school_id: school.id,
            })}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop"
          >
            <Plus className="mr-2 h-4 w-4" /> Add a club
          </button>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <a href={`/schools/${school.slug}?preview=1`} target="_blank" rel="noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-surface-soft text-sm font-semibold">
              <ExternalLink className="h-4 w-4" /> Preview school page
            </a>
            <Link to="/school/dashboard"
              className="flex h-11 items-center justify-center rounded-2xl bg-surface-soft text-sm font-semibold">
              Go to dashboard
            </Link>
          </div>
        </div>

        {editingClass && (
          <ClassEditorModal
            cls={editingClass}
            schools={[{ id: school.id, name: school.name }]}
            views={views}
            cats={cats}
            subs={subs}
            lockSchool
            onClose={() => setEditingClass(null)}
            onSaved={() => { setEditingClass(null); reloadClasses(); }}
          />
        )}
      </AppShell>
    );
  }

  /* ---------- Step 1: school details ---------- */
  return (
    <AppShell hideViewTabs>
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-4">
        <button onClick={() => (window.history.length > 1 ? window.history.back() : navigate({ to: "/" }))}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-2xl font-extrabold">Create your school page</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything here is shown on your public school profile. You can edit it any time from your dashboard.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="School name (KA) *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="School name (EN)" value={form.name_en} onChange={(v) => setForm({ ...form, name_en: v })} />

          <CityDistrictPicker
            city={form.city}
            district={form.district}
            onChange={(v) => setForm({ ...form, city: v.city, city_en: v.city_en, district: v.district })}
          />

          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
          <div className="md:col-span-2">
            <WorkingHoursEditor value={form.working_hours} onChange={(v: string) => setForm({ ...form, working_hours: v })} />
          </div>
          <Field label="Instagram URL" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} />
          <Field label="Facebook URL" value={form.facebook} onChange={(v) => setForm({ ...form, facebook: v })} />
          <Field label="WhatsApp (number or link)" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
          <Field label="TikTok URL" value={form.tiktok} onChange={(v) => setForm({ ...form, tiktok: v })} />

          <div className="md:col-span-2">
            <Field label="Short description (KA)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
          </div>
          <div className="md:col-span-2">
            <Field label="Short description (EN)" value={form.description_en} onChange={(v) => setForm({ ...form, description_en: v })} multiline />
          </div>
          <div className="md:col-span-2">
            <Field label="About the school (KA)" value={form.about} onChange={(v) => setForm({ ...form, about: v })} multiline />
          </div>
          <div className="md:col-span-2">
            <Field label="About the school (EN)" value={form.about_en} onChange={(v) => setForm({ ...form, about_en: v })} multiline />
          </div>

          <ImageUploader label="Logo" folder="schools" value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })} />
          <ImageUploader label="Cover image" folder="schools" value={form.cover_image_url} onChange={(url) => setForm({ ...form, cover_image_url: url })} />

          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold">Address & location on map</span>
            <AddressMapPicker
              address={form.address}
              lat={form.lat}
              lng={form.lng}
              onChange={(v) => setForm({ ...form, address: v.address, lat: v.lat, lng: v.lng })}
            />
          </div>
        </div>

        <button onClick={createSchool} disabled={saving}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop disabled:opacity-50">
          {saving ? "Creating…" : "Create school page"}
        </button>
      </div>
    </AppShell>
  );
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
      )}
    </label>
  );
}
