import { useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_KEYS, CATEGORIES, type CategoryKey } from "@/lib/categories";
import { ImageUploader, GalleryUploader } from "@/components/ImageUploader";
import { ImageUploadNotice } from "@/components/ImageUploadNotice";
import { BlocksEditor, TeachersEditor, type ContentBlock, type TeacherRow } from "@/components/ClassContentEditor";
import { useAuth } from "@/lib/auth-context";
import { AutoTranslateButton, BilingualField, type TranslatePair } from "@/components/AutoTranslate";
import { missingRequired, useRequiredFields } from "@/lib/required-fields";


const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const LANGUAGE_OPTIONS: string[] = ["Georgian", "English", "Russian", "German", "French", "Spanish", "Turkish", "Armenian"];
type Day = typeof DAYS[number];
export type ScheduleEntry = {
  day: Day;
  time?: string;
  from?: string;
  to?: string;
  group?: string;
  capacity?: number;
  taken?: number;
  note?: string;
};

export type FreeSlot = { date: string; time?: string | null; note?: string | null };

export interface ClassEditable {
  id?: string;
  title?: string;
  title_en?: string | null;

  category?: CategoryKey;
  school_id?: string;
  view_id?: string | null;
  subcategory_id?: string | null;
  category_ids?: string[] | null;
  subcategory_ids?: string[] | null;
  formats?: string[] | null;
  schedule_days?: ScheduleEntry[] | null;
  is_visible?: boolean | null;
  description?: string | null;
  description_en?: string | null;

  age_min?: number;
  age_max?: number;
  price_from?: number;
  price_group?: number | null;
  price_individual?: number | null;
  format?: "group" | "individual";
  language?: string | null;
  lesson_duration_min?: number | null;
  lessons_per_week?: number | null;
  schedule?: string | null;
  schedule_en?: string | null;


  image_url?: string | null;
  gallery?: string[] | null;
  benefits?: string[] | null;
  benefits_en?: string[] | null;

  is_featured?: boolean | null;
  is_new?: boolean | null;
  highlights?: ContentBlock[] | null;
  syllabus?: ContentBlock[] | null;
  extra_details?: ContentBlock[] | null;
  reviews_enabled?: boolean | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_facebook?: string | null;
  contact_instagram?: string | null;
  contact_tiktok?: string | null;
  ask_enabled?: boolean | null;
  open_lesson?: string | null;
  open_lesson_en?: string | null;
  free_lesson_slots?: FreeSlot[] | null;
  free_trial?: boolean | null;
  free_trial_note?: string | null;
  free_trial_note_en?: string | null;
}

export interface SchoolOption { id: string; name: string }
export interface ViewOption { id: string; name: string; slug: string }
export interface CatOption { id: string; name: string; view_id: string }
export interface SubOption { id: string; name: string; category_id: string }

export function ClassEditorModal({
  cls, schools, views, cats, subs, onClose, onSaved, lockSchool,
}: {
  cls: ClassEditable;
  schools: SchoolOption[];
  views: ViewOption[];
  cats: CatOption[];
  subs: SubOption[];
  onClose: () => void;
  onSaved: () => void;
  /** When true, hide the School selector (used when scoped to owner) */
  lockSchool?: boolean;
}) {
  const [form, setForm] = useState<ClassEditable>({
    ...cls,
    formats: cls.formats?.length ? cls.formats : (cls.format ? [cls.format] : ["group"]),
    category_ids: cls.category_ids ?? [],
    subcategory_ids: cls.subcategory_ids ?? (cls.subcategory_id ? [cls.subcategory_id] : []),
    schedule_days: (cls.schedule_days ?? []).map((r) => {
      if (r.from || r.to || !r.time) return r;
      const [a, b] = String(r.time).split(/[–\-—]/).map((s) => s.trim());
      return { ...r, from: a ?? "", to: b ?? "" };
    }),
    is_visible: cls.is_visible ?? true,
    highlights: cls.highlights ?? [],
    syllabus: cls.syllabus ?? [],
    extra_details: cls.extra_details ?? [],
    reviews_enabled: cls.reviews_enabled ?? true,
    ask_enabled: cls.ask_enabled ?? true,
    free_trial: cls.free_trial ?? false,
    free_lesson_slots: Array.isArray(cls.free_lesson_slots) ? cls.free_lesson_slots : [],
  });
  const { isAdmin } = useAuth();
  const { requiredKeys, isRequired, mark } = useRequiredFields("class");
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const isNew = !cls.id;

  useEffect(() => {
    if (!cls.id) return;
    supabase.from("class_teachers").select("*").eq("class_id", cls.id).order("sort_order")
      .then(({ data }) => setTeachers((data as unknown as TeacherRow[]) ?? []));
  }, [cls.id]);

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
    const missing = missingRequired("class", requiredKeys, {
      title: form.title,
      title_en: form.title_en,
      school_id: form.school_id,
      formats: form.formats,
      view_id: form.view_id,
      category_ids: form.category_ids,
      subcategory_ids: form.subcategory_ids,
      description: form.description,
      description_en: form.description_en,
      price_from: (form.formats ?? []).length
        ? [
            (form.formats ?? []).includes("group") ? form.price_group : null,
            (form.formats ?? []).includes("individual") ? form.price_individual : null,
          ].every((v) => v == null)
          ? null
          : 1
        : form.price_from,
      language: form.language,
      lesson_duration_min: form.lesson_duration_min,
      lessons_per_week: form.lessons_per_week,
      schedule_days: form.schedule_days,
      image_url: form.image_url,
      gallery: form.gallery,
      benefits: form.benefits,
      highlights: form.highlights,
      syllabus: form.syllabus,
      contact_phone: form.contact_phone,
      contact_whatsapp: form.contact_whatsapp,
    });
    if (missing.length > 0) return toast.error(`Please fill required fields: ${missing.join(", ")}`);
    setSaving(true);
    const payload = {
      title: form.title,
      title_en: form.title_en || null,

      school_id: form.school_id,
      category: (form.category || "creativity") as CategoryKey,
      view_id: form.view_id || null,
      subcategory_id: form.subcategory_ids?.[0] ?? null,
      category_ids: form.category_ids ?? [],
      subcategory_ids: form.subcategory_ids ?? [],
      description: form.description || null,
      description_en: form.description_en || null,

      age_min: Number(form.age_min) || 3,
      age_max: Number(form.age_max) || 14,
      price_group: (form.formats ?? []).includes("group") && form.price_group != null && String(form.price_group) !== "" ? Number(form.price_group) : null,
      price_individual: (form.formats ?? []).includes("individual") && form.price_individual != null && String(form.price_individual) !== "" ? Number(form.price_individual) : null,
      price_from: (() => {
        const list = [
          (form.formats ?? []).includes("group") ? Number(form.price_group) : NaN,
          (form.formats ?? []).includes("individual") ? Number(form.price_individual) : NaN,
        ].filter((n) => Number.isFinite(n)) as number[];
        return list.length ? Math.min(...list) : Number(form.price_from) || 0;
      })(),
      format: (form.formats?.[0] || "group") as "group" | "individual",
      formats: form.formats ?? [],
      schedule_days: form.schedule_days ?? [],
      is_visible: !!form.is_visible,
      language: (form.language ?? "").trim() || null,
      lesson_duration_min: form.lesson_duration_min ? Number(form.lesson_duration_min) : null,
      lessons_per_week: form.lessons_per_week ? Number(form.lessons_per_week) : null,
      schedule: form.schedule || null,
      schedule_en: form.schedule_en || null,

      image_url: form.image_url || null,
      gallery: form.gallery ?? [],
      benefits: form.benefits ?? [],
      benefits_en: form.benefits_en ?? [],

      ...(isAdmin ? { is_featured: !!form.is_featured, is_new: !!form.is_new } : {}),
      highlights: (form.highlights ?? []) as never,
      syllabus: (form.syllabus ?? []) as never,
      extra_details: (form.extra_details ?? []) as never,
      reviews_enabled: form.reviews_enabled !== false,
      contact_phone: form.contact_phone || null,
      contact_whatsapp: form.contact_whatsapp || null,
      contact_facebook: form.contact_facebook || null,
      contact_instagram: form.contact_instagram || null,
      contact_tiktok: form.contact_tiktok || null,
      ask_enabled: form.ask_enabled !== false,
      free_lesson_slots: (form.free_lesson_slots ?? []).filter((s) => s.date),
      open_lesson: form.open_lesson || null,
      open_lesson_en: form.open_lesson_en || null,
      free_trial: !!form.free_trial,
      free_trial_note: form.free_trial_note || null,
      free_trial_note_en: form.free_trial_note_en || null,
    };
    const res = isNew
      ? await supabase.from("classes").insert(payload as never).select("id").single()
      : await supabase.from("classes").update(payload as never).eq("id", cls.id!).select("id").single();
    if (res.error) { setSaving(false); return toast.error(res.error.message); }

    const classId = (res.data as { id: string }).id;
    // Smart sync teacher rows: delete only removed ones, upsert remaining/new ones
    const keptTeacherIds = teachers.map((t) => t.id).filter(Boolean) as string[];
    if (keptTeacherIds.length > 0) {
      await supabase
        .from("class_teachers")
        .delete()
        .eq("class_id", classId)
        .not("id", "in", `(${keptTeacherIds.join(",")})`);
    } else {
      await supabase.from("class_teachers").delete().eq("class_id", classId);
    }

    if (teachers.length) {
      const rows = teachers.map((t, i) => ({
        ...(t.id ? { id: t.id } : {}),
        class_id: classId,
        first_name: t.first_name || "",
        last_name: t.last_name || "",
        first_name_en: t.first_name_en || null,
        last_name_en: t.last_name_en || null,
        bio: t.bio || null,
        bio_en: t.bio_en || null,
        photo_url: t.photo_url || null,
        video_url: t.video_url || null,
        credentials: t.credentials ?? [],
        credentials_en: t.credentials_en ?? [],
        certificates: t.certificates ?? [],
        sort_order: i,
      }));
      const { error: tErr } = await supabase.from("class_teachers").upsert(rows as never);
      if (tErr) { setSaving(false); return toast.error(tErr.message); }
    }

    setSaving(false);
    toast.success(isNew ? "Class created" : "Class updated");
    onSaved();
  };

  const benefitsText = (form.benefits ?? []).join("\n");
  const benefitsEnText = (form.benefits_en ?? []).join("\n");
  const schedule = form.schedule_days ?? [];

  const blockPairs = (key: "highlights" | "syllabus" | "extra_details"): TranslatePair[] =>
    (form[key] ?? []).flatMap((b, i) => [
      {
        source: b.title,
        value: b.title_en,
        apply: (v: string) =>
          setForm((f) => ({ ...f, [key]: (f[key] ?? []).map((x, j) => (j === i ? { ...x, title_en: v } : x)) })),
      },
      {
        source: b.text,
        value: b.text_en,
        apply: (v: string) =>
          setForm((f) => ({ ...f, [key]: (f[key] ?? []).map((x, j) => (j === i ? { ...x, text_en: v } : x)) })),
      },
    ]);

  const translatePairs = (): TranslatePair[] => [
    { source: form.title, value: form.title_en, apply: (v) => setForm((f) => ({ ...f, title_en: v })) },
    { source: form.description, value: form.description_en, apply: (v) => setForm((f) => ({ ...f, description_en: v })) },
    { source: benefitsText, value: benefitsEnText, apply: (v) => setForm((f) => ({ ...f, benefits_en: v.split("\n").map((s) => s.trim()).filter(Boolean) })) },
    { source: form.schedule, value: form.schedule_en, apply: (v) => setForm((f) => ({ ...f, schedule_en: v })) },
    { source: form.free_trial_note, value: form.free_trial_note_en, apply: (v) => setForm((f) => ({ ...f, free_trial_note_en: v })) },
    ...blockPairs("highlights"),
    ...blockPairs("syllabus"),
    ...blockPairs("extra_details"),
    ...teachers.flatMap((t, i) => {
      const patch = (p: Partial<TeacherRow>) =>
        setTeachers((prev) => prev.map((x, j) => (j === i ? { ...x, ...p } : x)));
      return [
        { source: t.first_name, value: t.first_name_en, apply: (v: string) => patch({ first_name_en: v }) },
        { source: t.last_name, value: t.last_name_en, apply: (v: string) => patch({ last_name_en: v }) },
        { source: t.bio, value: t.bio_en, apply: (v: string) => patch({ bio_en: v }) },
        {
          source: (t.credentials ?? []).join("\n"),
          value: (t.credentials_en ?? []).join("\n"),
          apply: (v: string) => patch({ credentials_en: v.split("\n").map((s) => s.trim()).filter(Boolean) }),
        },
      ];
    }),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur md:items-center md:p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-elevated md:rounded-3xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{isNew ? "New class" : "Edit class"}</h2>
          <div className="flex items-center gap-2">
            <AutoTranslateButton pairs={translatePairs} label="Auto-translate to EN" />
            <button onClick={onClose} className="rounded-full p-1 hover:bg-surface-soft"><X className="h-5 w-5" /></button>
          </div>
        </div>


        <label className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-surface-soft p-3 text-sm">
          <input type="checkbox" checked={!!form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} className="h-4 w-4 rounded" />
          <div>
            <div className="font-semibold">Show on site</div>
            <div className="text-xs text-muted-foreground">When off, the class is hidden from the public site.</div>
          </div>
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <BilingualField
            label="Title"
            required
            ka={form.title || ""}
            en={form.title_en || ""}
            onKa={(v) => setForm({ ...form, title: v })}
            onEn={(v) => setForm({ ...form, title_en: v })}
          />

          {lockSchool ? (
            <Field label={mark("school_id", "School")} value={schools.find((s) => s.id === form.school_id)?.name || ""} onChange={() => {}} disabled />
          ) : (
            <Select label={mark("school_id", "School")} value={form.school_id || ""} onChange={(v) => setForm({ ...form, school_id: v })} options={schools.map((s) => ({ value: s.id, label: s.name }))} />
          )}

          <Select
            label={mark("view_id", "Main view (Education / Activity / Masterclasses / Services)")}
            value={form.view_id || ""}
            onChange={(v) => setForm({ ...form, view_id: v, category_ids: [], subcategory_ids: [] })}
            options={[{ value: "", label: "— Select —" }, ...views.map((v) => ({ value: v.id, label: v.name }))]}
          />
          <Select label="Legacy category" value={form.category || "creativity"} onChange={(v) => setForm({ ...form, category: v as CategoryKey })} options={CATEGORY_KEYS.map((k) => ({ value: k, label: `${CATEGORIES[k].emoji} ${CATEGORIES[k].label}` }))} />

          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold">{mark("category_ids", "Categories (pick one or several)")}</span>
            {!form.view_id ? (
              <p className="rounded-xl bg-surface-soft p-3 text-xs text-muted-foreground">Pick a main view first to see categories.</p>
            ) : viewCats.length === 0 ? (
              <p className="rounded-xl bg-surface-soft p-3 text-xs text-muted-foreground">No categories defined for this view.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {viewCats.map((cat) => {
                  const on = selectedCatIds.includes(cat.id);
                  return (
                    <button key={cat.id} type="button" onClick={() => {
                      const nextCats = toggleArr(form.category_ids, cat.id);
                      const allowedSubIds = new Set(subs.filter((s) => nextCats.includes(s.category_id)).map((s) => s.id));
                      const nextSubs = nextCats.length
                        ? (form.subcategory_ids ?? []).filter((id) => allowedSubIds.has(id))
                        : (form.subcategory_ids ?? []);
                      setForm({ ...form, category_ids: nextCats, subcategory_ids: nextSubs });
                    }} className={`rounded-full px-3 py-1 text-xs font-semibold ${on ? "bg-foreground text-background" : "bg-surface-soft hover:bg-muted"}`}>
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold">{mark("subcategory_ids", "Subcategories (pick one or several)")}</span>
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
                            <button key={s.id} type="button" onClick={() => setForm({ ...form, subcategory_ids: toggleArr(form.subcategory_ids, s.id) })} className={`rounded-full px-3 py-1 text-xs font-semibold ${on ? "bg-foreground text-background" : "bg-surface-soft hover:bg-muted"}`}>
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

          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold">{mark("formats", "Format (one or both)")}</span>
            <div className="flex gap-2">
              {(["group", "individual"] as const).map((f) => {
                const on = (form.formats ?? []).includes(f);
                return (
                  <button key={f} type="button" onClick={() => setForm({ ...form, formats: toggleArr(form.formats, f) })} className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize ${on ? "bg-foreground text-background" : "bg-surface-soft hover:bg-muted"}`}>
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Min age" type="number" value={String(form.age_min ?? 3)} onChange={(v) => setForm({ ...form, age_min: Number(v) })} />
          <Field label="Max age" type="number" value={String(form.age_max ?? 14)} onChange={(v) => setForm({ ...form, age_max: Number(v) })} />
          {(form.formats ?? []).includes("group") && (
            <Field
              label={mark("price_from", "Group price (₾, 0 = free)")}
              type="number"
              value={form.price_group == null ? "" : String(form.price_group)}
              onChange={(v) => setForm({ ...form, price_group: v === "" ? null : Number(v) })}
            />
          )}
          {(form.formats ?? []).includes("individual") && (
            <Field
              label={mark("price_from", "Individual price (₾, 0 = free)")}
              type="number"
              value={form.price_individual == null ? "" : String(form.price_individual)}
              onChange={(v) => setForm({ ...form, price_individual: v === "" ? null : Number(v) })}
            />
          )}
          {(form.formats ?? []).length === 0 && (
            <Field label={mark("price_from", "Price from (0 = free)")} type="number" value={String(form.price_from ?? 0)} onChange={(v) => setForm({ ...form, price_from: Number(v) })} />
          )}
          <Field
            label={mark("lesson_duration_min", "Lesson duration (minutes)")}
            type="number"
            value={form.lesson_duration_min == null ? "" : String(form.lesson_duration_min)}
            onChange={(v) => setForm({ ...form, lesson_duration_min: v === "" ? null : Number(v) })}
          />
          <Field
            label={mark("lessons_per_week", "Lessons per week")}
            type="number"
            value={form.lessons_per_week == null ? "" : String(form.lessons_per_week)}
            onChange={(v) => setForm({ ...form, lessons_per_week: v === "" ? null : Number(v) })}
          />

          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold">{mark("language", "Languages of instruction (pick one or several)")}</span>
            {(() => {
              const selected = (form.language ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const setSelected = (next: string[]) => setForm({ ...form, language: next.join(", ") });
              const custom = selected.filter((s) => !LANGUAGE_OPTIONS.includes(s));
              return (
                <>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((l) => {
                      const on = selected.includes(l);
                      return (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setSelected(on ? selected.filter((s) => s !== l) : [...selected, l])}
                          className={`rounded-full px-4 py-1.5 text-xs font-bold ${on ? "bg-foreground text-background" : "bg-surface-soft hover:bg-muted"}`}
                        >
                          {l}
                        </button>
                      );
                    })}
                    {custom.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setSelected(selected.filter((s) => s !== l))}
                        className="rounded-full bg-foreground px-4 py-1.5 text-xs font-bold text-background"
                      >
                        {l} ✕
                      </button>
                    ))}
                  </div>
                  <input
                    placeholder="Add another language and press Enter"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v && !selected.includes(v)) setSelected([...selected, v]);
                      (e.target as HTMLInputElement).value = "";
                    }}
                    className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </>
              );
            })()}
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="block text-xs font-semibold">{mark("schedule_days", "Schedule & groups")}</span>
              <span className="text-[11px] text-muted-foreground">Groups: {schedule.length}</span>
            </div>
            <div className="space-y-2">
              {schedule.map((row, i) => {
                const upd = (patch: Partial<ScheduleEntry>) => {
                  const next = [...schedule]; next[i] = { ...row, ...patch };
                  setForm({ ...form, schedule_days: next });
                };
                const cap = Number(row.capacity ?? 0);
                const taken = Number(row.taken ?? 0);
                const free = Math.max(0, cap - taken);
                return (
                  <div key={i} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="flex-1 min-w-[140px]">
                        <span className="mb-1 block text-[11px] text-muted-foreground">Group name</span>
                        <input placeholder={`Group ${i + 1}`} value={row.group ?? ""} onChange={(e) => upd({ group: e.target.value })} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                      </label>
                      <label>
                        <span className="mb-1 block text-[11px] text-muted-foreground">Day</span>
                        <select value={row.day} onChange={(e) => upd({ day: e.target.value as Day })} className="h-10 w-28 rounded-xl border border-border bg-background px-2 text-sm">
                          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </label>
                      <label>
                        <span className="mb-1 block text-[11px] text-muted-foreground">From</span>
                        <input type="time" value={row.from ?? ""} onChange={(e) => upd({ from: e.target.value })} className="h-10 w-28 rounded-xl border border-border bg-background px-2 text-sm" />
                      </label>
                      <label>
                        <span className="mb-1 block text-[11px] text-muted-foreground">To</span>
                        <input type="time" value={row.to ?? ""} onChange={(e) => upd({ to: e.target.value })} className="h-10 w-28 rounded-xl border border-border bg-background px-2 text-sm" />
                      </label>
                      <label>
                        <span className="mb-1 block text-[11px] text-muted-foreground">Seats</span>
                        <input type="number" min={0} value={String(row.capacity ?? "")} onChange={(e) => upd({ capacity: e.target.value === "" ? undefined : Number(e.target.value) })} className="h-10 w-20 rounded-xl border border-border bg-background px-2 text-sm" />
                      </label>
                      <label>
                        <span className="mb-1 block text-[11px] text-muted-foreground">Taken</span>
                        <input type="number" min={0} value={String(row.taken ?? "")} onChange={(e) => upd({ taken: e.target.value === "" ? undefined : Number(e.target.value) })} className="h-10 w-20 rounded-xl border border-border bg-background px-2 text-sm" />
                      </label>
                      <label className="flex-1 min-w-[140px]">
                        <span className="mb-1 block text-[11px] text-muted-foreground">Note (age, level, room…)</span>
                        <input value={row.note ?? ""} onChange={(e) => upd({ note: e.target.value })} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                      </label>
                      <div className="pb-2 text-[11px] font-semibold text-muted-foreground">Free: {cap ? free : "—"}</div>
                      <button type="button" onClick={() => setForm({ ...form, schedule_days: schedule.filter((_, j) => j !== i) })} className="mb-1 rounded-xl px-3 py-2 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <button type="button" onClick={() => setForm({ ...form, schedule_days: [...schedule, { day: "Mon", from: "", to: "", group: `Group ${schedule.length + 1}`, capacity: undefined, taken: 0, note: "" }] })} className="flex items-center gap-1 rounded-xl bg-surface-soft px-3 py-1.5 text-xs font-bold hover:bg-muted">
                <Plus className="h-3 w-3" /> Add group / day
              </button>
            </div>
          </div>

          <BilingualField
            label="Description"
            required={isRequired("description")}
            multiline
            ka={form.description || ""}
            en={form.description_en || ""}
            onKa={(v) => setForm({ ...form, description: v })}
            onEn={(v) => setForm({ ...form, description_en: v })}
          />
          <BilingualField
            label={mark("benefits", "Benefits (one per line)")}
            multiline
            ka={benefitsText}
            en={benefitsEnText}
            onKa={(v) => setForm({ ...form, benefits: v.split("\n").map((s) => s.trim()).filter(Boolean) })}
            onEn={(v) => setForm({ ...form, benefits_en: v.split("\n").map((s) => s.trim()).filter(Boolean) })}
          />
          <BilingualField
            label="Schedule note"
            ka={form.schedule || ""}
            en={form.schedule_en || ""}
            onKa={(v) => setForm({ ...form, schedule: v })}
            onEn={(v) => setForm({ ...form, schedule_en: v })}
          />

          <div className="md:col-span-2">
            <ImageUploader label={mark("image_url", "Cover image")} folder="classes" value={form.image_url || null} onChange={(url) => setForm({ ...form, image_url: url })} />
            <ImageUploadNotice />
          </div>
          <div className="md:col-span-2">
            <GalleryUploader label={mark("gallery", "Gallery")} value={form.gallery ?? []} folder="classes-gallery" onChange={(urls) => setForm({ ...form, gallery: urls })} />
          </div>

          <div className="md:col-span-2 border-t border-border pt-4">
            <BlocksEditor
              label={mark("highlights", "Highlights (cards under the title)")}
              hint="Each card has its own name and text — nothing is repeated on the page."
              addLabel="Add highlight"
              value={form.highlights ?? []}
              onChange={(v) => setForm({ ...form, highlights: v })}
            />
          </div>
          <div className="md:col-span-2">
            <BlocksEditor
              label={mark("syllabus", "Syllabus (lessons)")}
              hint="One block per lesson: lesson name + what it covers."
              addLabel="Add lesson"
              value={form.syllabus ?? []}
              onChange={(v) => setForm({ ...form, syllabus: v })}
            />
          </div>
          <div className="md:col-span-2">
            <BlocksEditor
              label="Additional details"
              addLabel="Add detail"
              value={form.extra_details ?? []}
              onChange={(v) => setForm({ ...form, extra_details: v })}
            />
          </div>
          <div className="md:col-span-2">
            <TeachersEditor value={teachers} onChange={setTeachers} />
          </div>

          <div className="md:col-span-2 border-t border-border pt-4">
            <span className="mb-1 block text-xs font-semibold">Club contacts</span>
            <p className="mb-2 text-[11px] text-muted-foreground">Leave empty to inherit the school contacts automatically. Fill in only what should differ for this club.</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Field label={mark("contact_phone", "Phone")} value={form.contact_phone || ""} onChange={(v) => setForm({ ...form, contact_phone: v })} />
              <Field label={mark("contact_whatsapp", "WhatsApp (number or link)")} value={form.contact_whatsapp || ""} onChange={(v) => setForm({ ...form, contact_whatsapp: v })} />
              <Field label="Facebook URL" value={form.contact_facebook || ""} onChange={(v) => setForm({ ...form, contact_facebook: v })} />
              <Field label="Instagram URL" value={form.contact_instagram || ""} onChange={(v) => setForm({ ...form, contact_instagram: v })} />
              <Field label="TikTok URL" value={form.contact_tiktok || ""} onChange={(v) => setForm({ ...form, contact_tiktok: v })} />
            </div>
          </div>

          <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border bg-surface-soft p-3 text-sm">
            <input type="checkbox" checked={form.ask_enabled !== false} onChange={(e) => setForm({ ...form, ask_enabled: e.target.checked })} className="h-4 w-4 rounded" />
            <div>
              <div className="font-semibold">Show “Ask a question” button</div>
              <div className="text-xs text-muted-foreground">When off, the button is hidden on the club page.</div>
            </div>
          </label>

          <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border bg-surface-soft p-3 text-sm">
            <input type="checkbox" checked={!!form.free_trial} onChange={(e) => setForm({ ...form, free_trial: e.target.checked })} className="h-4 w-4 rounded" />
            <div>
              <div className="font-semibold">Free lesson available</div>
              <div className="text-xs text-muted-foreground">Shown as a badge on the club page (free / open lesson).</div>
            </div>
          </label>
          <div className="md:col-span-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            <Field label="Free lesson note (KA)" value={form.free_trial_note || ""} onChange={(v) => setForm({ ...form, free_trial_note: v })} />
            <Field label="Free lesson note (EN)" value={form.free_trial_note_en || ""} onChange={(v) => setForm({ ...form, free_trial_note_en: v })} />
          </div>

          <div className="md:col-span-2 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Free lesson schedule</div>
                <div className="text-xs text-muted-foreground">
                  Add as many dates as you like (even a whole year) — the club page automatically shows the next upcoming one and hides past dates.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, free_lesson_slots: [...(form.free_lesson_slots ?? []), { date: "", time: "", note: "" }] })}
                className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-bold text-background"
              >
                + Add date
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {(form.free_lesson_slots ?? []).length === 0 && (
                <div className="text-xs text-muted-foreground">No dates yet.</div>
              )}
              {(form.free_lesson_slots ?? [])
                .map((slot, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 md:grid-cols-[10rem_7rem_1fr_auto]">
                    <input
                      type="date"
                      value={slot.date || ""}
                      onChange={(e) => {
                        const next = [...(form.free_lesson_slots ?? [])];
                        next[i] = { ...next[i], date: e.target.value };
                        setForm({ ...form, free_lesson_slots: next });
                      }}
                      className="h-10 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
                    />
                    <input
                      type="time"
                      value={slot.time || ""}
                      onChange={(e) => {
                        const next = [...(form.free_lesson_slots ?? [])];
                        next[i] = { ...next[i], time: e.target.value };
                        setForm({ ...form, free_lesson_slots: next });
                      }}
                      className="h-10 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Note (optional)"
                      value={slot.note || ""}
                      onChange={(e) => {
                        const next = [...(form.free_lesson_slots ?? [])];
                        next[i] = { ...next[i], note: e.target.value };
                        setForm({ ...form, free_lesson_slots: next });
                      }}
                      className="h-10 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, free_lesson_slots: (form.free_lesson_slots ?? []).filter((_, j) => j !== i) })}
                      className="h-10 rounded-xl border border-border px-3 text-xs font-semibold text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          </div>

          <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border bg-surface-soft p-3 text-sm">
            <input type="checkbox" checked={form.reviews_enabled !== false} onChange={(e) => setForm({ ...form, reviews_enabled: e.target.checked })} className="h-4 w-4 rounded" />
            <div>
              <div className="font-semibold">Allow parents to leave reviews</div>
              <div className="text-xs text-muted-foreground">When off, the review form is hidden on the club page.</div>
            </div>
          </label>
          {isAdmin && (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4 rounded" />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} className="h-4 w-4 rounded" />
                Mark as new
              </label>
            </>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-surface-soft">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-xl bg-foreground px-5 py-2 text-sm font-bold text-background disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline, type = "text", disabled }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: string; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} disabled={disabled} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-60" />
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
