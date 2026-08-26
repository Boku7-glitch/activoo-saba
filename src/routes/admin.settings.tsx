import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

interface Setting {
  key: string;
  value: { text?: string };
}

interface FieldDef {
  key: string;
  label: string;
  help?: string;
  multiline?: boolean;
}

interface Group {
  id: string;
  title: string;
  fields: FieldDef[];
}

const GROUPS: Group[] = [
  {
    id: "home",
    title: "Homepage",
    fields: [
      { key: "hero_title", label: "Hero title", multiline: true, help: "Big headline at the top." },
      { key: "hero_subtitle", label: "Hero subtitle", multiline: true },
      { key: "default_location", label: "Default location", help: "Shown when no city is picked." },
      { key: "section_popular_title", label: "'Popular' section title" },
      { key: "section_new_title", label: "'New' section title" },
      { key: "section_nearby_title", label: "'Nearby' section title" },
    ],
  },
  {
    id: "schools",
    title: "For schools page",
    fields: [
      { key: "for_schools_title", label: "Section title" },
      { key: "for_schools_subtitle", label: "Section subtitle", multiline: true },
      { key: "for_schools_cta", label: "CTA button label" },
      { key: "for_schools_benefits", label: "Benefits (one per line)", multiline: true },
    ],
  },
  {
    id: "match",
    title: "Smart match page",
    fields: [
      { key: "match_title", label: "Title" },
      { key: "match_subtitle", label: "Subtitle", multiline: true },
      { key: "match_cta", label: "Start button label" },
    ],
  },
  {
    id: "auth",
    title: "Sign in / Sign up",
    fields: [
      { key: "auth_welcome", label: "Welcome headline" },
      { key: "auth_subtitle", label: "Subtitle", multiline: true },
    ],
  },
  {
    id: "profile",
    title: "Profile page",
    fields: [
      { key: "profile_empty_saved", label: "Empty 'saved' message", multiline: true },
      { key: "profile_empty_history", label: "Empty 'history' message", multiline: true },
    ],
  },
  {
    id: "contact",
    title: "Footer & contacts",
    fields: [
      { key: "contact_phone", label: "Phone" },
      { key: "contact_email", label: "Email" },
      { key: "contact_address", label: "Office address" },
      { key: "social_instagram", label: "Instagram URL" },
      { key: "social_facebook", label: "Facebook URL" },
      { key: "social_telegram", label: "Telegram URL" },
      { key: "footer_about", label: "Footer about text", multiline: true },
    ],
  },
];

const ALL_FIELDS = GROUPS.flatMap((g) => g.fields);

function AdminSettings() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState(GROUPS[0].id);

  useEffect(() => {
    supabase.from("site_settings").select("*").then(({ data }) => {
      const map: Record<string, string> = {};
      (data as Setting[] | null)?.forEach((s) => { map[s.key] = s.value?.text ?? ""; });
      ALL_FIELDS.forEach((f) => { if (map[f.key] === undefined) map[f.key] = ""; });
      setValues(map);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const upserts = ALL_FIELDS.map((f) => ({ key: f.key, value: { text: values[f.key] ?? "" } }));
    const { error } = await supabase.from("site_settings").upsert(upserts, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Site copy saved");
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const group = GROUPS.find((g) => g.id === activeGroup)!;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Site copy</h1>
          <p className="text-sm text-muted-foreground">Edit headlines, microcopy and contacts across activoo.</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-bold text-background shadow-pop disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save all"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeGroup === g.id ? "bg-foreground text-background shadow-pop" : "bg-surface text-foreground hover:bg-surface-soft"
            }`}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <h2 className="text-base font-bold">{group.title}</h2>
        {group.fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-sm font-semibold">{f.label}</span>
            {f.help && <span className="mb-2 block text-xs text-muted-foreground">{f.help}</span>}
            {f.multiline ? (
              <textarea
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            ) : (
              <input
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
