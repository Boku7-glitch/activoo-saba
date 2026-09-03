import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RequiredEntity = "class" | "school";

export interface RequiredFieldDef {
  key: string;
  label: string;
  /** Always required by the app itself — cannot be switched off in admin. */
  locked?: boolean;
}

export const CLASS_FIELDS: RequiredFieldDef[] = [
  { key: "title", label: "Title", locked: true },
  { key: "school_id", label: "School", locked: true },
  { key: "formats", label: "Format (group / individual)", locked: true },
  { key: "title_en", label: "Title (EN)" },
  { key: "view_id", label: "Main view" },
  { key: "category_ids", label: "Categories" },
  { key: "subcategory_ids", label: "Subcategories" },
  { key: "description", label: "Description" },
  { key: "description_en", label: "Description (EN)" },
  { key: "price_from", label: "Price" },
  { key: "language", label: "Languages of lessons" },
  { key: "lesson_duration_min", label: "Lesson duration (minutes)" },
  { key: "lessons_per_week", label: "Lessons per week" },
  { key: "schedule_days", label: "Weekly schedule / groups" },
  { key: "image_url", label: "Cover image" },
  { key: "gallery", label: "Gallery" },
  { key: "benefits", label: "Benefits" },
  { key: "highlights", label: "Highlights" },
  { key: "syllabus", label: "Syllabus" },
  { key: "contact_phone", label: "Contact phone" },
  { key: "contact_whatsapp", label: "WhatsApp" },
];

export const SCHOOL_FIELDS: RequiredFieldDef[] = [
  { key: "name", label: "Name", locked: true },
  { key: "district", label: "District", locked: true },
  { key: "name_en", label: "Name (EN)" },
  { key: "city", label: "City" },
  { key: "address", label: "Address" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "working_hours", label: "Working hours" },
  { key: "description", label: "Short description" },
  { key: "about", label: "About the school" },
  { key: "logo_url", label: "Logo" },
  { key: "cover_image_url", label: "Cover image" },
];

export const FIELD_CATALOG: Record<RequiredEntity, RequiredFieldDef[]> = {
  class: CLASS_FIELDS,
  school: SCHOOL_FIELDS,
};

export const SETTING_KEY: Record<RequiredEntity, string> = {
  class: "required_fields_class",
  school: "required_fields_school",
};

export function lockedKeys(entity: RequiredEntity): string[] {
  return FIELD_CATALOG[entity].filter((f) => f.locked).map((f) => f.key);
}

export function parseRequiredKeys(entity: RequiredEntity, value: unknown): string[] {
  const keys = (value as { keys?: unknown } | null)?.keys;
  const list = Array.isArray(keys) ? keys.filter((k): k is string => typeof k === "string") : [];
  return Array.from(new Set([...lockedKeys(entity), ...list]));
}

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "number") return !Number.isFinite(v);
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Returns labels of required fields that are still empty. */
export function missingRequired(
  entity: RequiredEntity,
  requiredKeys: string[],
  values: Record<string, unknown>,
): string[] {
  const set = new Set(requiredKeys);
  return FIELD_CATALOG[entity]
    .filter((f) => set.has(f.key) && isEmpty(values[f.key]))
    .map((f) => f.label);
}

export function useRequiredFields(entity: RequiredEntity) {
  const [keys, setKeys] = useState<string[]>(() => lockedKeys(entity));

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_settings")
      .select("key,value")
      .eq("key", SETTING_KEY[entity])
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setKeys(parseRequiredKeys(entity, data?.value));
      });
    return () => {
      cancelled = true;
    };
  }, [entity]);

  const isRequired = (key: string) => keys.includes(key);
  const mark = (key: string, label: string) => (isRequired(key) ? `${label} *` : label);

  return { requiredKeys: keys, isRequired, mark };
}
