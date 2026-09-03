import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CityRow {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DistrictRow {
  id: string;
  city_id: string;
  slug: string;
  name: string;
  name_en: string | null;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
}

/** Loads cities + districts from the CMS tables. */
export function useLocations(includeInactive = false) {
  const [cities, setCities] = useState<CityRow[]>([]);
  const [districts, setDistricts] = useState<DistrictRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [c, d] = await Promise.all([
      supabase.from("cities").select("*").order("sort_order"),
      supabase.from("districts").select("*").order("sort_order"),
    ]);
    const cs = ((c.data as CityRow[] | null) ?? []).filter((x) => includeInactive || x.is_active);
    const ds = ((d.data as DistrictRow[] | null) ?? []).filter((x) => includeInactive || x.is_active);
    setCities(cs);
    setDistricts(ds);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  return { cities, districts, loading, refresh };
}

export function slugify(txt: string) {
  return txt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Human-readable "City · District" string; skips empty parts. */
export function formatLocation(city?: string | null, district?: string | null) {
  return [city?.trim(), district?.trim()].filter(Boolean).join(" · ");
}

/** Districts of a city that have no parent (top level). */
export function topDistricts(districts: DistrictRow[], cityId?: string | null) {
  return districts.filter((d) => !d.parent_id && (!cityId || d.city_id === cityId));
}

/** Direct children of a district. */
export function childDistricts(districts: DistrictRow[], parentId: string) {
  return districts.filter((d) => d.parent_id === parentId);
}

export function districtLabel(d: DistrictRow) {
  return d.name_en || d.name;
}
