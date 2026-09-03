import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const MATCH_CONFIG_KEY = "match_config";

export type MatchStepId = "age" | "category" | "location" | "format" | "budget";

export interface MatchStepConfig {
  id: MatchStepId;
  enabled: boolean;
  title: string;
  title_en: string;
  subtitle: string;
  subtitle_en: string;
}

export interface MatchConfig {
  steps: MatchStepConfig[];
  resultLimit: number;
  resultTitle: string;
  resultTitle_en: string;
  ctaLabel: string;
  ctaLabel_en: string;
  finishLabel: string;
  finishLabel_en: string;
}

export const STEP_META: Record<MatchStepId, { label: string; emoji: string; help: string }> = {
  age: { label: "Child age", emoji: "🎂", help: "Uses the age ranges from the Search filters tab." },
  category: { label: "Category", emoji: "🎨", help: "Main activity categories." },
  location: { label: "Location (district)", emoji: "📍", help: "Districts managed in Locations." },
  format: { label: "Format", emoji: "👥", help: "Group or individual lessons." },
  budget: { label: "Budget", emoji: "💸", help: "Uses the price ranges from the Search filters tab." },
};

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  steps: [
    { id: "age", enabled: true, title: "How old is your child?", title_en: "How old is your child?", subtitle: "We'll match age-appropriate classes.", subtitle_en: "We'll match age-appropriate classes." },
    { id: "category", enabled: true, title: "What are they into?", title_en: "What are they into?", subtitle: "Pick a category to start exploring.", subtitle_en: "Pick a category to start exploring." },
    { id: "location", enabled: false, title: "Where should it be?", title_en: "Where should it be?", subtitle: "Pick a district near you.", subtitle_en: "Pick a district near you." },
    { id: "format", enabled: false, title: "Group or individual?", title_en: "Group or individual?", subtitle: "Choose the lesson format.", subtitle_en: "Choose the lesson format." },
    { id: "budget", enabled: true, title: "What's your monthly budget?", title_en: "What's your monthly budget?", subtitle: "We'll show classes in your range.", subtitle_en: "We'll show classes in your range." },
  ],
  resultLimit: 20,
  resultTitle: "classes for you",
  resultTitle_en: "classes for you",
  ctaLabel: "Continue",
  ctaLabel_en: "Continue",
  finishLabel: "See my matches",
  finishLabel_en: "See my matches",
};

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() !== "" ? v : fallback;
}

export function parseMatchConfig(value: unknown): MatchConfig {
  const raw = value as Partial<MatchConfig> | null;
  if (!raw || typeof raw !== "object") return DEFAULT_MATCH_CONFIG;
  const rawSteps = Array.isArray(raw.steps) ? raw.steps : [];
  const known = new Map<MatchStepId, Partial<MatchStepConfig>>();
  rawSteps.forEach((s) => {
    if (s && typeof s.id === "string" && s.id in STEP_META) known.set(s.id as MatchStepId, s);
  });
  // preserve saved order, then append any missing defaults
  const orderedIds = rawSteps
    .map((s) => s?.id as MatchStepId)
    .filter((id): id is MatchStepId => !!id && id in STEP_META);
  DEFAULT_MATCH_CONFIG.steps.forEach((d) => {
    if (!orderedIds.includes(d.id)) orderedIds.push(d.id);
  });
  const steps = orderedIds.map((id) => {
    const def = DEFAULT_MATCH_CONFIG.steps.find((d) => d.id === id)!;
    const s = known.get(id) ?? {};
    return {
      id,
      enabled: typeof s.enabled === "boolean" ? s.enabled : def.enabled,
      title: str(s.title, def.title),
      title_en: str(s.title_en, def.title_en),
      subtitle: str(s.subtitle, def.subtitle),
      subtitle_en: str(s.subtitle_en, def.subtitle_en),
    } satisfies MatchStepConfig;
  });
  const limit = Number(raw.resultLimit);
  return {
    steps,
    resultLimit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 60) : DEFAULT_MATCH_CONFIG.resultLimit,
    resultTitle: str(raw.resultTitle, DEFAULT_MATCH_CONFIG.resultTitle),
    resultTitle_en: str(raw.resultTitle_en, DEFAULT_MATCH_CONFIG.resultTitle_en),
    ctaLabel: str(raw.ctaLabel, DEFAULT_MATCH_CONFIG.ctaLabel),
    ctaLabel_en: str(raw.ctaLabel_en, DEFAULT_MATCH_CONFIG.ctaLabel_en),
    finishLabel: str(raw.finishLabel, DEFAULT_MATCH_CONFIG.finishLabel),
    finishLabel_en: str(raw.finishLabel_en, DEFAULT_MATCH_CONFIG.finishLabel_en),
  };
}

/** Loads the CMS-managed Smart Match configuration. */
export function useMatchConfig() {
  const [config, setConfig] = useState<MatchConfig>(DEFAULT_MATCH_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", MATCH_CONFIG_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setConfig(parseMatchConfig(data?.value));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading };
}
