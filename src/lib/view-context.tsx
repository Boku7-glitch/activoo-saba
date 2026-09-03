import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export interface ViewRow {
  id: string;
  slug: string;
  name: string;
  name_en?: string | null;
  icon: string;
  icon_url?: string | null;
  accent_hex: string;
  accent_secondary_hex: string;
  sort_order: number;
  is_active: boolean;
}

export interface CategoryRow {
  id: string;
  view_id: string;
  slug: string;
  name: string;
  name_en?: string | null;
  icon: string;
  icon_url?: string | null;
  sort_order: number;
}

export interface SubcategoryRow {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  name_en?: string | null;
  icon?: string | null;
  icon_url?: string | null;
  sort_order: number;
}

export interface FilterRow {
  view_id: string;
  filter_type: "age" | "district" | "price" | "subcategory";
  is_enabled: boolean;
  sort_order: number;
}

interface ViewContextValue {
  views: ViewRow[];
  categories: CategoryRow[];
  subcategories: SubcategoryRow[];
  filters: FilterRow[];
  activeView: ViewRow | null;
  setActiveViewSlug: (slug: string) => void;
  loading: boolean;
}

const Ctx = createContext<ViewContextValue | null>(null);

const STORAGE_KEY = "activoo:view";

const DEFAULT_VIEWS: ViewRow[] = [
  { id: "v-education", slug: "education", name: "განათლება", name_en: "Education", icon: "GraduationCap", accent_hex: "#6366F1", accent_secondary_hex: "#818CF8", sort_order: 1, is_active: true },
  { id: "v-activity", slug: "activity", name: "აქტივობა", name_en: "Activity", icon: "Activity", accent_hex: "#EC4899", accent_secondary_hex: "#F472B6", sort_order: 2, is_active: true },
  { id: "v-masterclasses", slug: "masterclasses", name: "მასტერკლასები", name_en: "Masterclasses", icon: "Sparkles", accent_hex: "#F59E0B", accent_secondary_hex: "#FBBF24", sort_order: 3, is_active: true },
  { id: "v-services", slug: "services", name: "სერვისები", name_en: "Services", icon: "Briefcase", accent_hex: "#10B981", accent_secondary_hex: "#34D399", sort_order: 4, is_active: true },
];

const DEFAULT_CATEGORIES: CategoryRow[] = [
  { id: "c-art", view_id: "v-education", slug: "creativity", name: "შემოქმედება", name_en: "Art & Creativity", icon: "🎨", sort_order: 1 },
  { id: "c-it", view_id: "v-education", slug: "it", name: "IT და კოდინგი", name_en: "IT & Coding", icon: "💻", sort_order: 2 },
  { id: "c-sports", view_id: "v-activity", slug: "sports", name: "სპორტი", name_en: "Sports", icon: "⚽", sort_order: 3 },
  { id: "c-dev", view_id: "v-education", slug: "development", name: "განვითარება", name_en: "Early Development", icon: "🧠", sort_order: 4 },
  { id: "c-lang", view_id: "v-education", slug: "languages", name: "ენები", name_en: "Languages", icon: "🌍", sort_order: 5 },
];

export function ViewProvider({ children }: { children: ReactNode }) {
  const [views, setViews] = useState<ViewRow[]>(DEFAULT_VIEWS);
  const [categories, setCategories] = useState<CategoryRow[]>(DEFAULT_CATEGORIES);
  const [subcategories, setSubcategories] = useState<SubcategoryRow[]>([]);
  const [filters, setFilters] = useState<FilterRow[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>("education");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("views").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("view_categories").select("*").order("sort_order"),
      supabase.from("view_subcategories").select("*").order("sort_order"),
      supabase.from("view_filters").select("*").order("sort_order"),
    ]).then(([v, c, s, f]) => {
      const vs = (v.data as ViewRow[] | null) ?? [];
      const cs = (c.data as CategoryRow[] | null) ?? [];
      setViews(vs.length > 0 ? vs : DEFAULT_VIEWS);
      setCategories(cs.length > 0 ? cs : DEFAULT_CATEGORIES);
      setSubcategories((s.data as SubcategoryRow[] | null) ?? []);
      setFilters((f.data as FilterRow[] | null) ?? []);
      // Initial active view: localStorage -> first view
      const activeList = vs.length > 0 ? vs : DEFAULT_VIEWS;
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      const initial = activeList.find((x) => x.slug === stored) ?? activeList[0];
      if (initial) setActiveSlug(initial.slug);
      setLoading(false);
    }).catch(() => {
      setViews(DEFAULT_VIEWS);
      setCategories(DEFAULT_CATEGORIES);
      setLoading(false);
    });
  }, []);

  const activeView = useMemo(
    () => views.find((v) => v.slug === activeSlug) ?? null,
    [views, activeSlug],
  );

  // Apply CSS variables for accent palette
  useEffect(() => {
    if (!activeView || typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--view-accent", activeView.accent_hex);
    root.style.setProperty("--view-accent-2", activeView.accent_secondary_hex);
    root.style.setProperty(
      "--view-gradient",
      `linear-gradient(135deg, ${activeView.accent_hex}, ${activeView.accent_secondary_hex})`,
    );
    root.style.setProperty(
      "--view-gradient-soft",
      `linear-gradient(135deg, ${activeView.accent_hex}22, ${activeView.accent_secondary_hex}33)`,
    );
  }, [activeView]);

  const setActiveViewSlug = (slug: string) => {
    setActiveSlug(slug);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, slug);
  };

  const value: ViewContextValue = {
    views,
    categories,
    subcategories,
    filters,
    activeView,
    setActiveViewSlug,
    loading,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useView() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useView must be inside ViewProvider");
  return ctx;
}

export function useViewCategories(viewId?: string | null) {
  const { categories } = useView();
  return useMemo(
    () => (viewId ? categories.filter((c) => c.view_id === viewId) : []),
    [categories, viewId],
  );
}

export function useViewFilters(viewId?: string | null) {
  const { filters } = useView();
  return useMemo(
    () => (viewId ? filters.filter((f) => f.view_id === viewId && f.is_enabled) : []),
    [filters, viewId],
  );
}

/** Sync ?view= URL param with active view (use only on pages that want it). */
export function useViewUrlSync() {
  const { activeView, setActiveViewSlug, views } = useView();
  const search = useSearch({ strict: false }) as { view?: string };
  const navigate = useNavigate();

  useEffect(() => {
    if (search.view && views.find((v) => v.slug === search.view) && search.view !== activeView?.slug) {
      setActiveViewSlug(search.view);
    }
  }, [search.view, views]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeView) return;
    if (search.view !== activeView.slug) {
      navigate({ to: ".", search: (prev: Record<string, unknown>) => ({ ...prev, view: activeView.slug }), replace: true } as never);
    }
  }, [activeView]); // eslint-disable-line react-hooks/exhaustive-deps
}
