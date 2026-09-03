import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { AutoTranslateButton, TranslateInline } from "@/components/AutoTranslate";
import { DEFAULT_AGE_RANGES, DEFAULT_PRICE_RANGES, ageLabel, priceLabel } from "@/lib/filter-ranges";
import { FIELD_CATALOG, SETTING_KEY, lockedKeys, parseRequiredKeys, type RequiredEntity } from "@/lib/required-fields";
import { DEFAULT_MATCH_CONFIG, MATCH_CONFIG_KEY, STEP_META, parseMatchConfig, type MatchConfig, type MatchStepConfig } from "@/lib/match-config";
import { ArrowDown, ArrowUp } from "lucide-react";

interface RangeRow {
  min: number;
  max: number;
}


export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

interface Setting {
  key: string;
  value: { text?: string } | null;
  value_en: { text?: string } | null;
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
  {
    id: "uploads",
    title: "Image uploads",
    fields: [
      { key: "image_upload_notice", label: "Upload warning note", multiline: true, help: "Shown under image uploaders in school and club editors — reminds users visuals must comply with T&C." },
    ],
  },
];

const ALL_FIELDS = GROUPS.flatMap((g) => g.fields);

const FILTER_GROUP: Group = { id: "filters", title: "Search filters", fields: [] };
const REQUIRED_GROUP: Group = { id: "required", title: "Required fields", fields: [] };
const PROMO_GROUP: Group = { id: "promoted", title: "Recommended block", fields: [] };
const MATCH_GROUP: Group = { id: "match_steps", title: "Smart match steps", fields: [] };
const TAB_GROUPS = [...GROUPS, FILTER_GROUP, REQUIRED_GROUP, PROMO_GROUP, MATCH_GROUP];

export const PROMOTED_KEY = "promoted_classes";

interface PickerClass { id: string; title: string; title_en: string | null; schools: { name: string | null } | null }

function AdminSettings() {
  const [ka, setKa] = useState<Record<string, string>>({});
  const [en, setEn] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState(GROUPS[0].id);
  const [ageRanges, setAgeRanges] = useState<RangeRow[]>(DEFAULT_AGE_RANGES);
  const [priceRanges, setPriceRanges] = useState<RangeRow[]>(DEFAULT_PRICE_RANGES);
  const [requiredClass, setRequiredClass] = useState<string[]>(() => lockedKeys("class"));
  const [requiredSchool, setRequiredSchool] = useState<string[]>(() => lockedKeys("school"));
  const [promoted, setPromoted] = useState<string[]>([]);
  const [allClasses, setAllClasses] = useState<PickerClass[]>([]);
  const [promoQuery, setPromoQuery] = useState("");
  const [matchConfig, setMatchConfig] = useState<MatchConfig>(DEFAULT_MATCH_CONFIG);

  useEffect(() => {
    supabase
      .from("classes")
      .select("id,title,title_en,schools(name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => setAllClasses((data as unknown as PickerClass[]) ?? []));
  }, []);

  useEffect(() => {
    supabase.from("site_settings").select("*").then(({ data }) => {
      const kaMap: Record<string, string> = {};
      const enMap: Record<string, string> = {};
      (data as (Setting & { value: { text?: string; ranges?: RangeRow[] } | null })[] | null)?.forEach((s) => {
        kaMap[s.key] = s.value?.text ?? "";
        enMap[s.key] = s.value_en?.text ?? "";
        if (s.key === "filter_age_ranges" && Array.isArray(s.value?.ranges) && s.value.ranges.length > 0) {
          setAgeRanges(s.value.ranges);
        }
        if (s.key === "filter_price_ranges" && Array.isArray(s.value?.ranges) && s.value.ranges.length > 0) {
          setPriceRanges(s.value.ranges);
        }
        if (s.key === SETTING_KEY.class) setRequiredClass(parseRequiredKeys("class", s.value));
        if (s.key === SETTING_KEY.school) setRequiredSchool(parseRequiredKeys("school", s.value));
        if (s.key === MATCH_CONFIG_KEY) setMatchConfig(parseMatchConfig(s.value));
        if (s.key === PROMOTED_KEY) {
          const ids = (s.value as { ids?: string[] } | null)?.ids;
          if (Array.isArray(ids)) setPromoted(ids);
        }
      });
      ALL_FIELDS.forEach((f) => {
        if (kaMap[f.key] === undefined) kaMap[f.key] = "";
        if (enMap[f.key] === undefined) enMap[f.key] = "";
      });
      setKa(kaMap);
      setEn(enMap);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const cleanAge = ageRanges.filter((r) => Number.isFinite(r.min) && Number.isFinite(r.max) && r.max >= r.min);
    const cleanPrice = priceRanges.filter((r) => Number.isFinite(r.min) && Number.isFinite(r.max) && r.max >= r.min);
    if (cleanAge.length === 0 || cleanPrice.length === 0) {
      setSaving(false);
      return toast.error("Age and price filters need at least one valid range (max ≥ min).");
    }
    const upserts = [
      ...ALL_FIELDS.map((f) => ({
        key: f.key,
        value: { text: ka[f.key] ?? "" },
        value_en: { text: en[f.key] ?? "" },
      })),
      { key: "filter_age_ranges", value: { ranges: cleanAge }, value_en: null },
      { key: "filter_price_ranges", value: { ranges: cleanPrice }, value_en: null },
      { key: SETTING_KEY.class, value: { keys: requiredClass }, value_en: null },
      { key: SETTING_KEY.school, value: { keys: requiredSchool }, value_en: null },
      { key: PROMOTED_KEY, value: { ids: promoted }, value_en: null },
      { key: MATCH_CONFIG_KEY, value: matchConfig as unknown as Record<string, unknown>, value_en: null },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("site_settings").upsert(upserts as any, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Site copy saved");
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const group = TAB_GROUPS.find((g) => g.id === activeGroup)!;
  const isFilterGroup = activeGroup === "filters";
  const isRequiredGroup = activeGroup === "required";
  const isPromoGroup = activeGroup === "promoted";
  const isMatchGroup = activeGroup === "match_steps";
  const promoFiltered = allClasses.filter((c) => {
    const q = promoQuery.trim().toLowerCase();
    if (!q) return true;
    return `${c.title} ${c.title_en ?? ""} ${c.schools?.name ?? ""} ${c.id}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Site copy</h1>
          <p className="text-sm text-muted-foreground">Edit headlines, microcopy and contacts across activoo in Georgian and English.</p>
        </div>
        <div className="flex items-center gap-2">
          <AutoTranslateButton
            label="Auto-translate this section"
            pairs={() =>
              group.fields.map((f) => ({
                source: ka[f.key],
                value: en[f.key],
                apply: (v: string) => setEn((prev) => ({ ...prev, [f.key]: v })),
              }))
            }
          />
          <AutoTranslateButton
            label="Translate whole site copy"
            pairs={() =>
              ALL_FIELDS.map((f) => ({
                source: ka[f.key],
                value: en[f.key],
                apply: (v: string) => setEn((prev) => ({ ...prev, [f.key]: v })),
              }))
            }
          />
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-bold text-background shadow-pop disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save all"}
          </button>
        </div>

      </div>

      <div className="flex flex-wrap gap-2">
        {TAB_GROUPS.map((g) => (
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

      <div className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <h2 className="text-base font-bold">{group.title}</h2>
        {isFilterGroup ? (
          <div className="grid gap-5 md:grid-cols-2">
            <RangeEditor
              title="Age ranges (years)"
              help="Shown in the Age filter on search and in Smart Match."
              ranges={ageRanges}
              onChange={setAgeRanges}
              labelFor={ageLabel}
            />
            <RangeEditor
              title="Price ranges (₾ / month)"
              help="Shown in the Price filter on search and in Smart Match. Use 99999 as max for an open-ended range."
              ranges={priceRanges}
              onChange={setPriceRanges}
              labelFor={priceLabel}
            />
          </div>
        ) : null}
        {isRequiredGroup ? (
          <div className="grid gap-5 md:grid-cols-2">
            <RequiredFieldsEditor
              entity="class"
              title="Club / class form"
              help="Checked fields are marked with * in the admin and in the school owner dashboard, and must be filled before saving a club."
              selected={requiredClass}
              onChange={setRequiredClass}
            />
            <RequiredFieldsEditor
              entity="school"
              title="School profile form"
              help="Checked fields are marked with * and must be filled before saving a school."
              selected={requiredSchool}
              onChange={setRequiredSchool}
            />
          </div>
        ) : null}
        {isPromoGroup ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Clubs checked here appear in the “Recommended” promo block at the very top of the homepage, above Popular.
              If nothing is selected, the block is hidden. Admin only.
            </p>
            <div className="flex flex-wrap gap-2">
              {promoted.length === 0 ? (
                <span className="text-xs text-muted-foreground">No clubs promoted yet.</span>
              ) : promoted.map((id) => {
                const c = allClasses.find((x) => x.id === id);
                return (
                  <span key={id} className="flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                    {c?.title ?? id.slice(0, 8)}
                    <button onClick={() => setPromoted(promoted.filter((p) => p !== id))} aria-label="Remove">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
            <input
              value={promoQuery}
              onChange={(e) => setPromoQuery(e.target.value)}
              placeholder="Search clubs by title, school or ID…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
              {promoFiltered.map((c) => {
                const on = promoted.includes(c.id);
                return (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-soft">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => setPromoted(e.target.checked ? [...promoted, c.id] : promoted.filter((p) => p !== c.id))}
                    />
                    <span className="font-semibold">{c.title}</span>
                    <span className="text-xs text-muted-foreground">{c.schools?.name ?? ""} · {c.id.slice(0, 8)}</span>
                  </label>
                );
              })}
              {promoFiltered.length === 0 && <div className="p-2 text-xs text-muted-foreground">No clubs found.</div>}
            </div>
          </div>
        ) : null}
        {isMatchGroup ? (
          <MatchStepsEditor config={matchConfig} onChange={setMatchConfig} />
        ) : null}
        {!isFilterGroup && !isRequiredGroup && !isPromoGroup && !isMatchGroup && group.fields.map((f) => (
          <div key={f.key} className="rounded-xl border border-border/60 bg-background/50 p-3">
            <div className="mb-2">
              <span className="block text-sm font-semibold">{f.label}</span>
              {f.help && <span className="mt-0.5 block text-xs text-muted-foreground">{f.help}</span>}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <LangInput
                lang="KA"
                value={ka[f.key] ?? ""}
                onChange={(v) => setKa({ ...ka, [f.key]: v })}
                multiline={f.multiline}
              />
              <LangInput
                lang="EN"
                value={en[f.key] ?? ""}
                source={ka[f.key] ?? ""}
                onChange={(v) => setEn({ ...en, [f.key]: v })}
                multiline={f.multiline}
                placeholder="Optional — falls back to Georgian if empty"
              />

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LangInput({
  lang, value, onChange, multiline, placeholder, source,
}: { lang: "KA" | "EN"; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string; source?: string }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        <span className="rounded bg-muted px-1.5 py-0.5">{lang}</span>
        {lang === "EN" && <TranslateInline source={source} onResult={onChange} />}
      </span>

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        />
      )}
    </label>
  );
}

function RequiredFieldsEditor({
  entity, title, help, selected, onChange,
}: {
  entity: RequiredEntity;
  title: string;
  help?: string;
  selected: string[];
  onChange: (keys: string[]) => void;
}) {
  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);

  return (
    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
      <div className="mb-3">
        <span className="block text-sm font-semibold">{title}</span>
        {help && <span className="mt-0.5 block text-xs text-muted-foreground">{help}</span>}
      </div>
      <div className="space-y-1.5">
        {FIELD_CATALOG[entity].map((f) => (
          <label
            key={f.key}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm ${f.locked ? "opacity-70" : "hover:bg-surface-soft"}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(f.key)}
              disabled={f.locked}
              onChange={() => toggle(f.key)}
              className="h-4 w-4 accent-primary"
            />
            <span className="flex-1">{f.label}</span>
            {f.locked && <span className="text-[10px] font-bold uppercase text-muted-foreground">always</span>}
          </label>
        ))}
      </div>
    </div>
  );
}

function RangeEditor({
  title, help, ranges, onChange, labelFor,
}: {
  title: string;
  help?: string;
  ranges: RangeRow[];
  onChange: (rows: RangeRow[]) => void;
  labelFor: (min: number, max: number) => string;
}) {
  const update = (i: number, patch: Partial<RangeRow>) =>
    onChange(ranges.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(ranges.filter((_, idx) => idx !== i));
  const add = () => {
    const last = ranges[ranges.length - 1];
    onChange([...ranges, { min: last ? last.max + 1 : 0, max: last ? last.max + 10 : 10 }]);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
      <div className="mb-3">
        <span className="block text-sm font-semibold">{title}</span>
        {help && <span className="mt-0.5 block text-xs text-muted-foreground">{help}</span>}
      </div>
      <div className="space-y-2">
        {ranges.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="number"
              value={Number.isFinite(r.min) ? r.min : ""}
              onChange={(e) => update(i, { min: Number(e.target.value) })}
              placeholder="Min"
              className="h-9 w-20 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="number"
              value={Number.isFinite(r.max) ? r.max : ""}
              onChange={(e) => update(i, { max: Number(e.target.value) })}
              placeholder="Max"
              className="h-9 w-20 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
            />
            <span className="flex-1 truncate text-xs font-medium text-muted-foreground">
              {Number.isFinite(r.min) && Number.isFinite(r.max) ? labelFor(r.min, r.max) : ""}
            </span>
            <button
              onClick={() => remove(i)}
              aria-label="Remove range"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-soft"
        >
          <Plus className="h-3.5 w-3.5" /> Add range
        </button>
      </div>
    </div>
  );
}

function MatchStepsEditor({ config, onChange }: { config: MatchConfig; onChange: (c: MatchConfig) => void }) {
  const patchStep = (id: string, patch: Partial<MatchStepConfig>) =>
    onChange({ ...config, steps: config.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= config.steps.length) return;
    const steps = [...config.steps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    onChange({ ...config, steps });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Choose which questions the Smart match wizard asks, in which order, and the copy for each step.
        Age and budget options come from the “Search filters” tab; locations come from the Locations page.
      </p>

      <div className="space-y-3">
        {config.steps.map((s, i) => (
          <div key={s.id} className="rounded-xl border border-border/60 bg-background/50 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) => patchStep(s.id, { enabled: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                <span>{STEP_META[s.id].emoji} {STEP_META[s.id].label}</span>
              </label>
              <span className="flex-1 text-xs text-muted-foreground">{STEP_META[s.id].help}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} aria-label="Move up" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-soft">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(i, 1)} aria-label="Move down" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-soft">
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            {s.enabled && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <LangInput lang="KA" value={s.title} onChange={(v) => patchStep(s.id, { title: v })} placeholder="Question title" />
                <LangInput lang="EN" value={s.title_en} source={s.title} onChange={(v) => patchStep(s.id, { title_en: v })} placeholder="Question title (EN)" />
                <LangInput lang="KA" value={s.subtitle} onChange={(v) => patchStep(s.id, { subtitle: v })} multiline placeholder="Helper text" />
                <LangInput lang="EN" value={s.subtitle_en} source={s.subtitle} onChange={(v) => patchStep(s.id, { subtitle_en: v })} multiline placeholder="Helper text (EN)" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-xl border border-border/60 bg-background/50 p-3 md:grid-cols-2">
        <div className="md:col-span-2 text-sm font-semibold">Results screen</div>
        <LangInput lang="KA" value={config.resultTitle} onChange={(v) => onChange({ ...config, resultTitle: v })} placeholder="…classes for you" />
        <LangInput lang="EN" value={config.resultTitle_en} source={config.resultTitle} onChange={(v) => onChange({ ...config, resultTitle_en: v })} />
        <LangInput lang="KA" value={config.ctaLabel} onChange={(v) => onChange({ ...config, ctaLabel: v })} placeholder="Continue button" />
        <LangInput lang="EN" value={config.ctaLabel_en} source={config.ctaLabel} onChange={(v) => onChange({ ...config, ctaLabel_en: v })} />
        <LangInput lang="KA" value={config.finishLabel} onChange={(v) => onChange({ ...config, finishLabel: v })} placeholder="Final button" />
        <LangInput lang="EN" value={config.finishLabel_en} source={config.finishLabel} onChange={(v) => onChange({ ...config, finishLabel_en: v })} />
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Max results</span>
          <input
            type="number"
            min={1}
            max={60}
            value={config.resultLimit}
            onChange={(e) => onChange({ ...config, resultLimit: Number(e.target.value) })}
            className="h-10 w-28 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>
    </div>
  );
}
