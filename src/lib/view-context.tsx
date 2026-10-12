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

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUUID(val: unknown): val is string {
  return typeof val === "string" && UUID_REGEX.test(val);
}

const DEFAULT_VIEWS: ViewRow[] = [
  { id: "9355e7e7-c8da-492b-be18-07a24467fe5e", slug: "education", name: "განათლება", name_en: "Education", icon: "GraduationCap", accent_hex: "#7c3aed", accent_secondary_hex: "#a855f7", sort_order: 10, is_active: true },
  { id: "e3c1e208-7107-4498-85da-669af5068d96", slug: "activity", name: "აქტივობა", name_en: "Activity", icon: "Activity", accent_hex: "#059669", accent_secondary_hex: "#10b981", sort_order: 20, is_active: true },
  { id: "11111111-1111-1111-1111-000000000003", slug: "masterclasses", name: "მასტერკლასები", name_en: "Masterclasses", icon: "Sparkles", accent_hex: "#d97706", accent_secondary_hex: "#f59e0b", sort_order: 30, is_active: true },
  { id: "ec17ed2a-0135-4eeb-b8d2-60196fae8502", slug: "services", name: "სერვისები", name_en: "Services", icon: "Briefcase", accent_hex: "#2563eb", accent_secondary_hex: "#3b82f6", sort_order: 40, is_active: true },
];

const DEFAULT_CATEGORIES: CategoryRow[] = [
  { id: "703ee081-dbd7-48c7-8964-bafccb6c3e18", view_id: "9355e7e7-c8da-492b-be18-07a24467fe5e", slug: "creativity", name: "შემოქმედება", name_en: "Art & Creativity", icon: "🎨", sort_order: 1 },
  { id: "22222222-2222-2222-2222-000000000002", view_id: "9355e7e7-c8da-492b-be18-07a24467fe5e", slug: "it", name: "IT და კოდინგი", name_en: "IT & Coding", icon: "💻", sort_order: 2 },
  { id: "22222222-2222-2222-2222-000000000003", view_id: "e3c1e208-7107-4498-85da-669af5068d96", slug: "sports", name: "სპორტი", name_en: "Sports", icon: "⚽", sort_order: 3 },
  { id: "22222222-2222-2222-2222-000000000004", view_id: "9355e7e7-c8da-492b-be18-07a24467fe5e", slug: "development", name: "განვითარება", name_en: "Early Development", icon: "🧠", sort_order: 4 },
  { id: "22222222-2222-2222-2222-000000000005", view_id: "9355e7e7-c8da-492b-be18-07a24467fe5e", slug: "languages", name: "ენები", name_en: "Languages", icon: "🌍", sort_order: 5 },
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
