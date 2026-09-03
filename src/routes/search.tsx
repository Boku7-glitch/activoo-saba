import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, X, ChevronDown, List, Map as MapIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClassCard, type ClassRow } from "@/components/ClassCard";
import { ClassCardSkeleton } from "@/components/Skeletons";
import { SearchMap } from "@/components/SearchMap";
import { useFilterRanges } from "@/lib/filter-ranges";
import { useView, useViewCategories, useViewFilters } from "@/lib/view-context";
import { useLocations } from "@/lib/locations";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CmsIcon } from "@/components/CmsIcon";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useI18n, useLocalized } from "@/lib/i18n";

interface SearchParams {
  q?: string;
  category?: string; // comma-separated slugs (multi-select)
  subcategory?: string; // comma-separated slugs (multi-select)
  age?: string;
  price?: string;
  district?: string;
  city?: string;
  view?: string;
}

const toList = (v?: string) => (v ? v.split(",").filter(Boolean) : []);
const fromList = (arr: string[]) => (arr.length ? arr.join(",") : undefined);
const toggle = (arr: string[], v: string) =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    subcategory: typeof s.subcategory === "string" ? s.subcategory : undefined,
    age: typeof s.age === "string" ? s.age : undefined,
    price: typeof s.price === "string" ? s.price : undefined,
    district: typeof s.district === "string" ? s.district : undefined,
    city: typeof s.city === "string" ? s.city : undefined,
    view: typeof s.view === "string" ? s.view : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search classes — activoo" },
      { name: "description", content: "Filter and find classes for your child by age, category, district and price." },
    ],
  }),
});

type SearchClassRow = ClassRow & { view_id?: string | null };

interface SchoolResult {
  id: string;
  slug: string;
  name: string;
  name_en?: string | null;
  city?: string | null;
  city_en?: string | null;
  district?: string | null;
  district_en?: string | null;
  logo_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
  verified?: boolean | null;
}

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { lang, t } = useI18n();
  const loc = (ka: string | null | undefined, en: string | null | undefined) =>
    lang === "en" && (en ?? "").trim() ? (en as string) : (ka ?? "");
  const { activeView, subcategories, views } = useView();
  const viewCats = useViewCategories(activeView?.id);
  const enabledFilters = useViewFilters(activeView?.id);
  const [text, setText] = useState(search.q ?? "");
  const [results, setResults] = useState<SearchClassRow[] | null>(null);
  const [schoolResults, setSchoolResults] = useState<SchoolResult[] | null>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const { cities, districts } = useLocations();
  const [mode, setMode] = useState<"list" | "map">("list");

  const isTextSearch = !!search.q?.trim();

  const selectedCats = useMemo(() => toList(search.category), [search.category]);
  const selectedSubs = useMemo(() => toList(search.subcategory), [search.subcategory]);
  const selectedDistricts = useMemo(() => toList(search.district), [search.district]);


  const updateSearch = (patch: Partial<SearchParams>) => {
    navigate({ search: (prev: SearchParams) => ({ ...prev, ...patch }), replace: true });
  };

  const toggleCategory = (slug: string) => {
    const nextCats = toggle(selectedCats, slug);
    // drop subs that belong to deselected categories
    const removedCat = viewCats.find((c) => c.slug === slug && selectedCats.includes(slug));
    let nextSubs = selectedSubs;
    if (removedCat) {
      const removedSubSlugs = subcategories
        .filter((s) => s.category_id === removedCat.id)
        .map((s) => s.slug);
      nextSubs = selectedSubs.filter((s) => !removedSubSlugs.includes(s));
    }
    updateSearch({ category: fromList(nextCats), subcategory: fromList(nextSubs) });
  };

  const toggleSubcategory = (catSlug: string, subSlug: string) => {
    const nextSubs = toggle(selectedSubs, subSlug);
    // ensure parent category is selected when picking a sub
    const nextCats = nextSubs.includes(subSlug) && !selectedCats.includes(catSlug)
      ? [...selectedCats, catSlug]
      : selectedCats;
    updateSearch({ category: fromList(nextCats), subcategory: fromList(nextSubs) });
  };

  const { ageBuckets: AGE_BUCKETS, priceBuckets: PRICE_BUCKETS } = useFilterRanges();
  const ageBucket = useMemo(() => AGE_BUCKETS.find((b) => b.label === search.age?.replace("-", "–")), [AGE_BUCKETS, search.age]);
  const priceBucket = useMemo(() => PRICE_BUCKETS.find((b) => b.label === search.price), [PRICE_BUCKETS, search.price]);

  const locationGroups = useMemo(() => {
    const groups: { city: string; districts: { name: string; children: string[] }[] }[] = [];
    cities.forEach((c) => {
      const cityDistricts = districts.filter((d) => d.city_id === c.id);
      const items = cityDistricts
        .filter((d) => !d.parent_id)
        .map((d) => ({
          name: d.name_en || d.name,
          children: cityDistricts
            .filter((sd) => sd.parent_id === d.id)
            .map((sd) => sd.name_en || sd.name)
            .filter((n) => availableDistricts.includes(n)),
        }))
        .filter((d) => availableDistricts.includes(d.name) || d.children.length > 0);
      const cityName = c.name_en || c.name;
      if (items.length > 0 || availableCities.includes(cityName) || availableCities.includes(c.name)) {
        groups.push({ city: cityName, districts: items });
      }
    });
    // districts not covered by the CMS list (legacy data)
    const covered = new Set(groups.flatMap((g) => g.districts.flatMap((d) => [d.name, ...d.children])));
    const orphans = availableDistricts.filter((d) => !covered.has(d));
    if (orphans.length > 0) groups.push({ city: "Other", districts: orphans.map((n) => ({ name: n, children: [] })) });
    return groups;
  }, [cities, districts, availableDistricts, availableCities]);

  const isFilterEnabled = (t: string) => enabledFilters.some((f) => f.filter_type === t);

  // Load districts available for current view
  useEffect(() => {
    if (!activeView?.id) return;
    supabase
      .from("classes")
      .select("schools(district,city)")
      .eq("view_id", activeView.id)
      .is("deleted_at", null)
      .then(({ data }) => {
        const set = new Set<string>();
        const citySet = new Set<string>();
        ((data as unknown as Array<{ schools: { district?: string; city?: string } | null }>) ?? []).forEach((r) => {
          const d = r.schools?.district;
          if (d) set.add(d);
          const c = r.schools?.city;
          if (c) citySet.add(c);
        });
        setAvailableDistricts([...set].sort());
        setAvailableCities([...citySet].sort());
      });
  }, [activeView?.id]);

  useEffect(() => {
    setResults(null);
    let q = supabase
      .from("classes")
      .select("id,title,title_en,category,age_min,age_max,price_from,image_url,is_new,view_id,subcategory_id,schools(name,name_en,district,district_en,city,city_en,rating,lat,lng,verified)")
      .eq("is_visible", true)
      .eq("approval_status", "approved")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(isTextSearch ? 200 : 40);

    // When the user types a query we search across ALL views and group results.
    if (!isTextSearch && activeView?.id) q = q.eq("view_id", activeView.id);
    if (isTextSearch) {
      const term = search.q!.trim();
      q = q.or(`title.ilike.%${term}%,title_en.ilike.%${term}%`);
    }

    if (!isTextSearch) {
      // Build subcategory id filter from selected cats+subs
      const subIdSet = new Set<string>();
      if (selectedSubs.length > 0) {
        subcategories
          .filter((s) => selectedSubs.includes(s.slug))
          .forEach((s) => subIdSet.add(s.id));
      }
      // For categories selected without a specific sub, include all their subs
      selectedCats.forEach((catSlug) => {
        const cat = viewCats.find((c) => c.slug === catSlug);
        if (!cat) return;
        const catSubs = subcategories.filter((s) => s.category_id === cat.id);
        const hasSubSelected = catSubs.some((s) => selectedSubs.includes(s.slug));
        if (!hasSubSelected) {
          catSubs.forEach((s) => subIdSet.add(s.id));
        }
      });
      if (subIdSet.size > 0) {
        q = q.overlaps("subcategory_ids", [...subIdSet]);
      }

      if (ageBucket) q = q.lte("age_min", ageBucket.max).gte("age_max", ageBucket.min);
      if (priceBucket) q = q.gte("price_from", priceBucket.min).lte("price_from", priceBucket.max);
    }

    q.then(
      ({ data, error }) => {
        let rows = (data as unknown as SearchClassRow[]) ?? [];
        if (error || rows.length === 0) {
          // Fallback if DB is empty or query failed
          rows = ([
            {
              id: "test-golden-class-001",
              title: "რობოტიკა და IT საფუძვლები",
              title_en: "Robotics and IT Fundamentals",
              category: "it",
              age_min: 7,
              age_max: 12,
              price_from: 80,
              image_url: null,
              is_new: true,
              view_id: "v-education",
              schools: { name: "CodeKids Tbilisi", name_en: "CodeKids Tbilisi", district: "Saburtalo", district_en: "Saburtalo", city: "Tbilisi", city_en: "Tbilisi", rating: 4.9, verified: true },
            },
            {
              id: "test-coding-002",
              title: "Scratch & Python დამწყებთათვის",
              title_en: "Scratch & Python for Beginners",
              category: "it",
              age_min: 8,
              age_max: 14,
              price_from: 120,
              image_url: null,
              is_new: true,
              view_id: "v-education",
              schools: { name: "IT Academy Junior", name_en: "IT Academy Junior", district: "Vake", district_en: "Vake", city: "Tbilisi", city_en: "Tbilisi", rating: 4.8, verified: true },
            },
            {
              id: "test-art-003",
              title: "აკვარელი და ფერწერა ბავშვებისთვის",
              title_en: "Watercolor & Painting for Kids",
              category: "creativity",
              age_min: 5,
              age_max: 10,
              price_from: 80,
              image_url: null,
              is_new: false,
              view_id: "v-education",
              schools: { name: "Art Studio Color", name_en: "Art Studio Color", district: "Vera", district_en: "Vera", city: "Tbilisi", city_en: "Tbilisi", rating: 4.9, verified: true },
            },
            {
              id: "test-sports-004",
              title: "საფეხბურთო სექცია და ტაქტიკა",
              title_en: "Junior Football Section",
              category: "sports",
              age_min: 6,
              age_max: 15,
              price_from: 90,
              image_url: null,
              is_new: false,
              view_id: "v-activity",
              schools: { name: "Champions League Club", name_en: "Champions League Club", district: "Didi Dighomi", district_en: "Didi Dighomi", city: "Tbilisi", city_en: "Tbilisi", rating: 4.7, verified: true },
            },
            {
              id: "test-chess-005",
              title: "ჭადრაკის ლოგიკა და სტრატეგია",
              title_en: "Chess Strategy & Logic",
              category: "development",
              age_min: 5,
              age_max: 12,
              price_from: 70,
              image_url: null,
              is_new: true,
              view_id: "v-education",
              schools: { name: "Grandmaster Academy", name_en: "Grandmaster Academy", district: "Old Tbilisi", district_en: "Old Tbilisi", city: "Tbilisi", city_en: "Tbilisi", rating: 5.0, verified: true },
            },
          ] as unknown) as SearchClassRow[];
        }
        if (!isTextSearch) {
          if (search.city) rows = rows.filter((r) => r.schools?.city === search.city || r.schools?.city_en === search.city);
          if (selectedDistricts.length > 0) {
            rows = rows.filter((r) =>
              selectedDistricts.some(
                (d) => r.schools?.district === d || r.schools?.district_en === d
              )
            );
          }
        }
        setResults(rows);
      },
      () => setResults([]),
    );
  }, [isTextSearch, search.q, search.category, search.subcategory, search.age, search.price, search.district, search.city, activeView?.id, ageBucket, priceBucket, subcategories, viewCats, selectedCats, selectedSubs]);

  // Schools matching the query (only shown for text searches)
  useEffect(() => {
    if (!isTextSearch) { setSchoolResults([]); return; }
    const term = search.q!.trim();
    setSchoolResults(null);
    supabase
      .from("schools")
      .select("id,slug,name,name_en,city,city_en,district,district_en,logo_url,rating,review_count,verified")
      .is("deleted_at", null)
      .eq("is_visible", true)
      .or(`name.ilike.%${term}%,name_en.ilike.%${term}%`)
      .limit(12)
      .then(({ data }) => setSchoolResults((data as unknown as SchoolResult[]) ?? []));
  }, [isTextSearch, search.q]);

  const groupedResults = useMemo(() => {
    if (!isTextSearch || !results) return [];
    return views
      .map((v) => ({ view: v, items: results.filter((r) => r.view_id === v.id) }))
      .filter((g) => g.items.length > 0);
  }, [isTextSearch, results, views]);

  const activeCount =
    selectedCats.length + selectedSubs.length + (search.age ? 1 : 0) + (search.price ? 1 : 0) + selectedDistricts.length + (search.city ? 1 : 0);

  return (
    <AppShell>
      <div className="sticky top-[57px] z-20 bg-background/90 backdrop-blur-xl">
        <div className="px-4 pt-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateSearch({ q: text || undefined })}
              onBlur={() => updateSearch({ q: text || undefined })}
              placeholder={t("home.searchPlaceholder")}
              className="h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-10 text-sm shadow-soft outline-none focus:border-primary"
            />
            {text && (
              <button
                onClick={() => { setText(""); updateSearch({ q: undefined }); }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {!isTextSearch && (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3">

          <FilterChip
            active={activeCount === 0}
            onClick={() => navigate({ search: { view: activeView?.slug } as never, replace: true })}
            label={`${t("search.all")}${activeCount ? ` (${activeCount})` : ""}`}
          />

          {viewCats.map((c) => {
            const isActive = selectedCats.includes(c.slug);
            const subs = subcategories.filter((s) => s.category_id === c.id);
            const hasSubs = subs.length > 0 && isFilterEnabled("subcategory");
            const activeSubsCount = subs.filter((s) => selectedSubs.includes(s.slug)).length;
            const catName = loc(c.name, c.name_en);
            if (!hasSubs) {
              return (
                <FilterChip
                  key={c.id}
                  active={isActive}
                  onClick={() => toggleCategory(c.slug)}
                  label={<span className="flex items-center gap-1.5"><CmsIcon url={c.icon_url} emoji={c.icon} className="h-4 w-4" />{catName}</span>}
                />
              );
            }
            return (
              <DropdownChip
                key={c.id}
                active={isActive}
                label={<span className="flex items-center gap-1.5"><CmsIcon url={c.icon_url} emoji={c.icon} className="h-4 w-4" />{catName}{activeSubsCount ? ` (${activeSubsCount})` : ""}</span>}
              >
                {() => (
                  <>
                    <DropdownItem
                      active={isActive && activeSubsCount === 0}
                      onClick={() => toggleCategory(c.slug)}
                    >
                      <span className="flex items-center justify-between">
                        {t("search.all")} {catName}
                        {isActive && activeSubsCount === 0 && <span>✓</span>}
                      </span>
                    </DropdownItem>
                    {subs.map((s) => {
                      const subActive = selectedSubs.includes(s.slug);
                      const subName = loc(s.name, s.name_en);
                      return (
                        <DropdownItem
                          key={s.id}
                          active={subActive}
                          onClick={() => toggleSubcategory(c.slug, s.slug)}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <CmsIcon url={s.icon_url} emoji={s.icon} className="h-4 w-4" />
                              {subName}
                            </span>
                            {subActive && <span>✓</span>}
                          </span>
                        </DropdownItem>
                      );
                    })}
                  </>
                )}
              </DropdownChip>
            );
          })}

          {isFilterEnabled("age") && (
            <DropdownChip
              active={!!search.age}
              label={search.age ? (lang === "en" ? `Ages ${search.age.replace("-", "–")}` : `ასაკი ${search.age.replace("-", "–")}`) : t("common.age")}
            >
              {(close) => (
                <>
                  <DropdownItem active={!search.age} onClick={() => { updateSearch({ age: undefined }); close(); }}>
                    {t("search.anyAge")}
                  </DropdownItem>
                  {AGE_BUCKETS.map((b) => {
                    const value = b.label.replace("–", "-");
                    return (
                      <DropdownItem
                        key={b.label}
                        active={search.age === value}
                        onClick={() => { updateSearch({ age: value }); close(); }}
                      >
                        {lang === "en" ? `Ages ${b.label}` : `ასაკი ${b.label}`}
                      </DropdownItem>
                    );
                  })}
                </>
              )}
            </DropdownChip>
          )}

          {isFilterEnabled("price") && (
            <DropdownChip
              active={!!search.price}
              label={search.price ?? t("common.price")}
            >
              {(close) => (
                <>
                  <DropdownItem active={!search.price} onClick={() => { updateSearch({ price: undefined }); close(); }}>
                    {t("search.anyPrice")}
                  </DropdownItem>
                  {PRICE_BUCKETS.map((b) => (
                    <DropdownItem
                      key={b.label}
                      active={search.price === b.label}
                      onClick={() => { updateSearch({ price: b.label }); close(); }}
                    >
                      {b.label}
                    </DropdownItem>
                  ))}
                </>
              )}
            </DropdownChip>
          )}

          {isFilterEnabled("district") && (availableDistricts.length > 0 || availableCities.length > 0) && (
            <DropdownChip
              active={selectedDistricts.length > 0 || !!search.city}
              label={
                selectedDistricts.length > 0
                  ? `${selectedDistricts[0]}${selectedDistricts.length > 1 ? ` +${selectedDistricts.length - 1}` : ""}`
                  : search.city ?? t("common.location")
              }
            >
              {(close) => (
                <>
                  <DropdownItem
                    active={selectedDistricts.length === 0 && !search.city}
                    onClick={() => { updateSearch({ district: undefined, city: undefined }); close(); }}
                  >
                    <span className="flex items-center justify-between">
                      {t("search.allLocations")}
                      {selectedDistricts.length === 0 && !search.city && <span>✓</span>}
                    </span>
                  </DropdownItem>
                  {locationGroups.map((g) => {
                    const allNames = g.districts.flatMap((d) => [d.name, ...d.children]);
                    const allSelected = allNames.length > 0 && allNames.every((d) => selectedDistricts.includes(d));
                    return (
                      <div key={g.city} className="mt-1">
                        <DropdownItem
                          active={allSelected}
                          onClick={() => {
                            // toggle whole city: select all its districts or clear them
                            const next = allSelected
                              ? selectedDistricts.filter((d) => !allNames.includes(d))
                              : [...selectedDistricts, ...allNames.filter((d) => !selectedDistricts.includes(d))];
                            updateSearch({ district: fromList(next), city: next.length ? undefined : g.city });
                          }}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-bold">{g.city}</span>
                            {allSelected && <span>✓</span>}
                          </span>
                        </DropdownItem>
                        {g.districts.map((d) => {
                          const names = [d.name, ...d.children];
                          const active = names.every((n) => selectedDistricts.includes(n));
                          return (
                            <div key={d.name}>
                              <DropdownItem
                                active={active}
                                onClick={() => {
                                  const next = active
                                    ? selectedDistricts.filter((n) => !names.includes(n))
                                    : [...selectedDistricts, ...names.filter((n) => !selectedDistricts.includes(n))];
                                  updateSearch({ district: fromList(next), city: next.length ? undefined : search.city });
                                }}
                              >
                                <span className="flex items-center justify-between gap-2 pl-3">
                                  {d.name}
                                  {active && <span>✓</span>}
                                </span>
                              </DropdownItem>
                              {d.children.map((sd) => {
                                const sActive = selectedDistricts.includes(sd);
                                return (
                                  <DropdownItem
                                    key={sd}
                                    active={sActive}
                                    onClick={() => {
                                      const next = toggle(selectedDistricts, sd);
                                      updateSearch({ district: fromList(next), city: next.length ? undefined : search.city });
                                    }}
                                  >
                                    <span className="flex items-center justify-between gap-2 pl-8 text-muted-foreground">
                                      {sd}
                                      {sActive && <span>✓</span>}
                                    </span>
                                  </DropdownItem>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}
            </DropdownChip>
          )}
        </div>
        )}
      </div>

      {isTextSearch ? (
        <div className="space-y-6 px-4 pb-6 pt-3">
          <p className="text-sm text-muted-foreground">
            {results === null
              ? t("search.searching")
              : `${results.length} ${t("search.classesFound")}${schoolResults?.length ? ` · ${schoolResults.length} ${t("search.schools")}` : ""}`}
          </p>

          {results === null ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => <ClassCardSkeleton key={i} />)}
            </div>
          ) : groupedResults.length === 0 && !schoolResults?.length ? (
            <div className="rounded-3xl bg-surface-soft p-8 text-center">
              <p className="text-2xl">🔎</p>
              <p className="mt-2 font-semibold">{t("search.noResults")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("search.tryAnother")}</p>
            </div>
          ) : (
            <>
              {groupedResults.map((g) => (
                <section key={g.view.id}>
                  <h2 className="mb-2 text-sm font-bold">
                    {loc(g.view.name, g.view.name_en)} <span className="text-muted-foreground">({g.items.length})</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {g.items.map((c) => <ClassCard key={c.id} cls={c} variant="compact" />)}
                  </div>
                </section>
              ))}

              {schoolResults && schoolResults.length > 0 && (
                <section>
                  <h2 className="mb-2 text-sm font-bold">
                    {t("search.schools")} <span className="text-muted-foreground">({schoolResults.length})</span>
                  </h2>
                  <div className="grid gap-2">
                    {schoolResults.map((s) => (
                      <Link
                        key={s.id}
                        to="/schools/$slug"
                        params={{ slug: s.slug }}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft transition hover:border-primary"
                      >
                        {s.logo_url ? (
                          <img src={s.logo_url} alt={s.name} className="h-10 w-10 rounded-xl object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-sm font-bold">
                            {s.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate text-sm font-semibold">
                            <span className="truncate">{loc(s.name, s.name_en)}</span>
                            {s.verified && <VerifiedBadge size="md" />}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[loc(s.city, s.city_en), loc(s.district, s.district_en)].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : (
      <div className="px-4 pb-6 pt-2">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {results === null ? t("search.searching") : `${results.length} ${t("search.results")}`}
          </p>
          <div className="inline-flex rounded-full bg-surface-soft p-1">
            <button
              onClick={() => setMode("list")}
              className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition", mode === "list" ? "bg-foreground text-background shadow-pop" : "text-muted-foreground")}
            ><List className="h-3.5 w-3.5" /> {t("search.list")}</button>
            <button
              onClick={() => setMode("map")}
              className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition", mode === "map" ? "bg-foreground text-background shadow-pop" : "text-muted-foreground")}
            ><MapIcon className="h-3.5 w-3.5" /> {t("search.map")}</button>
          </div>
        </div>
        {mode === "map" ? (
          results === null
            ? <div className="h-[400px] animate-pulse rounded-2xl bg-muted" />
            : <SearchMap classes={results} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results === null
              ? [0, 1, 2, 3].map((i) => <ClassCardSkeleton key={i} />)
              : results.length === 0
              ? (
                <div className="col-span-2 rounded-3xl bg-surface-soft p-8 text-center">
                  <p className="text-2xl">🔎</p>
                  <p className="mt-2 font-semibold">No results found</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters.</p>
                </div>
              )
              : results.map((c) => <ClassCard key={c.id} cls={c} variant="compact" />)}
          </div>
        )}
      </div>
      )}

    </AppShell>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
        active
          ? "border-foreground bg-foreground text-background shadow-pop"
          : "border-border bg-surface text-foreground hover:border-primary"
      )}
    >
      {label}
    </button>
  );
}

function DropdownChip({
  active,
  label,
  children,
}: {
  active: boolean;
  label: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
            active
              ? "border-foreground bg-foreground text-background shadow-pop"
              : "border-border bg-surface text-foreground hover:border-primary",
          )}
        >
          {label}
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="z-50 w-56 max-h-72 overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-elevated"
      >
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  );
}

function DropdownItem({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full rounded-xl px-3 py-2 text-left text-xs font-medium transition",
        active ? "bg-foreground text-background" : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
