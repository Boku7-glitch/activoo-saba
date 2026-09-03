import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RangeBucket {
  label: string;
  min: number;
  max: number;
}

export const DEFAULT_AGE_RANGES: { min: number; max: number }[] = [
  { min: 3, max: 5 },
  { min: 6, max: 9 },
  { min: 10, max: 14 },
];

export const DEFAULT_PRICE_RANGES: { min: number; max: number }[] = [
  { min: 0, max: 49 },
  { min: 50, max: 100 },
  { min: 100, max: 99999 },
];

export function ageLabel(min: number, max: number): string {
  return `${min}–${max}`;
}

export function priceLabel(min: number, max: number): string {
  if (min <= 0) return `Under ${max + 1} ₾`;
  if (max >= 99999) return `${min}+ ₾`;
  return `${min}–${max} ₾`;
}

export function toAgeBuckets(ranges: { min: number; max: number }[]): RangeBucket[] {
  return ranges.map((r) => ({ label: ageLabel(r.min, r.max), min: r.min, max: r.max }));
}

export function toPriceBuckets(ranges: { min: number; max: number }[]): RangeBucket[] {
  return ranges.map((r) => ({ label: priceLabel(r.min, r.max), min: r.min, max: r.max }));
}

function parseRanges(value: unknown): { min: number; max: number }[] | null {
  const ranges = (value as { ranges?: unknown } | null)?.ranges;
  if (!Array.isArray(ranges)) return null;
  const parsed = ranges
    .map((r) => ({ min: Number((r as { min?: unknown }).min), max: Number((r as { max?: unknown }).max) }))
    .filter((r) => Number.isFinite(r.min) && Number.isFinite(r.max) && r.max >= r.min);
  return parsed.length > 0 ? parsed : null;
}

export interface FilterRanges {
  ageBuckets: RangeBucket[];
  priceBuckets: RangeBucket[];
}

export function useFilterRanges(): FilterRanges {
  const [ranges, setRanges] = useState<FilterRanges>({
    ageBuckets: toAgeBuckets(DEFAULT_AGE_RANGES),
    priceBuckets: toPriceBuckets(DEFAULT_PRICE_RANGES),
  });

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["filter_age_ranges", "filter_price_ranges"])
      .then(({ data }) => {
        if (cancelled || !data) return;
        const age = parseRanges(data.find((r) => r.key === "filter_age_ranges")?.value);
        const price = parseRanges(data.find((r) => r.key === "filter_price_ranges")?.value);
        setRanges({
          ageBuckets: toAgeBuckets(age ?? DEFAULT_AGE_RANGES),
          priceBuckets: toPriceBuckets(price ?? DEFAULT_PRICE_RANGES),
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return ranges;
}
