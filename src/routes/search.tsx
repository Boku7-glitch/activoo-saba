import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, X, ChevronDown, List, Map as MapIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClassCard, type ClassRow } from "@/components/ClassCard";
import { ClassCardSkeleton } from "@/components/Skeletons";
import { SearchMap } from "@/components/SearchMap";
import { AGE_BUCKETS, PRICE_BUCKETS } from "@/lib/categories";
import { useView, useViewCategories, useViewFilters } from "@/lib/view-context";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SearchParams {
  q?: string;
  category?: string;
  subcategory?: string;
  age?: string;
  price?: string;
  district?: string;
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
    view: typeof s.view === "string" ? s.view : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search classes — activoo" },
      { name: "description", content: "Filter and find classes for your child by age, category, district and price." },
    ],
  }),
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { activeView, subcategories } = useView();
  const viewCats = useViewCategories(activeView?.id);
  const enabledFilters = useViewFilters(activeView?.id);
  const [text, setText] = useState(search.q ?? "");
  const [results, setResults] = useState<ClassRow[] | null>(null);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [mode, setMode] = useState<"list" | "map">("list");

  const selectedCats = useMemo(() => toList(search.category), [search.category]);
  const selectedSubs = useMemo(() => toList(search.subcategory), [search.subcategory]);

  const updateSearch = (patch: Partial<SearchParams>) => {
    navigate({ search: (prev: SearchParams) => ({ ...prev, ...patch }), replace: true });
  };

  const toggleCategory = (slug: string) => {
    const nextCats = toggle(selectedCats, slug);
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
    const nextCats = nextSubs.includes(subSlug) && !selectedCats.includes(catSlug)
      ? [...selectedCats, catSlug]
      : selectedCats;
    updateSearch({ category: fromList(nextCats), subcategory: fromList(nextSubs) });
  };

  const ageBucket = useMemo(() => AGE_BUCKETS.find((b) => b.label === search.age?.replace("-", "–")), [search.age]);
  const priceBucket = useMemo(() => PRICE_BUCKETS.find((b) => b.label === search.price), [search.price]);

  const isFilterEnabled = (t: string) => enabledFilters.some((f) => f.filter_type === t);

  useEffect(() => {
    if (!activeView?.id) return;
    supabase
      .from("classes")
      .select("schools(district)")
      .eq("view_id", activeView.id)
      .then(({ data, error }) => {
        if (error) console.error("Error fetching districts:", error);
        const set = new Set<string>();
        ((data as unknown as Array<{ schools: { district?: string } | null }>) ?? []).forEach((r) => {
          const d = r.schools?.district;
          if (d) set.add(d);
        });
        setAvailableDistricts([...set].sort());
      });
  }, [activeView?.id]);

  useEffect(() => {
    setResults(null);
    let q = supabase
      .from("classes")
      .select("id,title,category,age_min,age_max,price_from,image_url,is_new,view_id,subcategory_id,schools(name,district,rating,lat,lng)")
      // Search-ში გამოსაჩენად აუცილებელია რომ is_visible იყოს true
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(40);

    if (activeView?.id) q = q.eq("view_id", activeView.id);
    if (search.q) q = q.ilike("title", `%${search.q}%`);

    const subIdSet = new Set<string>();
    if (selectedSubs.length > 0) {
      subcategories
        .filter((s) => selectedSubs.includes(s.slug))
        .forEach((s) => subIdSet.add(s.id));
    }
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

    q.then(({ data, error }) => {
      if (error) {
        console.error("Supabase Search Error:", error.message);
      } else {
        console.log("Raw classes from Supabase:", data);
      }

      let rows = (data as unknown as ClassRow[]) ?? [];
      if (search.district) rows = rows.filter((r) => r.schools?.district === search.district);
      setResults(rows);
    });
  }, [search.q, search.category, search.subcategory, search.age, search.price, search.district, activeView?.id, ageBucket, priceBucket, subcategories, viewCats, selectedCats, selectedSubs]);

  const activeCount =
    selectedCats.length + selectedSubs.length + (search.age ? 1 : 0) + (search.price ? 1 : 0) + (search.district ? 1 : 0);

  return (
    <AppShell>
      <div className="sticky top-[57px] z-20 bg-background/90 backdrop-blur-xl">
        <div className="px-4 pt-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateSearch({ q: text || undefined })}
              onBlur={() => updateSearch({ q: text || undefined })}
              placeholder="Search for a class or school"
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

        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3">
          <FilterChip
            active={activeCount === 0}
            onClick={() => navigate({ search: { view: activeView?.slug } as never, replace: true })}
            label={`All${activeCount ? ` (clear ${activeCount})` : ""}`}
          />

          {viewCats.map((c) => {
            const isActive = selectedCats.includes(c.slug);
            const subs = subcategories.filter((s) => s.category_id === c.id);
            const hasSubs = subs.length > 0 && isFilterEnabled("subcategory");
            const activeSubsCount = subs.filter((s) => selectedSubs.includes(s.slug)).length;
            if (!hasSubs) {
              return (
                <FilterChip
                  key={c.id}
                  active={isActive}
                  onClick={() => toggleCategory(c.slug)}
                  label={`${c.icon} ${c.name}`}
                />
              );
            }
            return (
              <DropdownChip
                key={c.id}
                active={isActive}
                label={`${c.icon} ${c.name}${activeSubsCount ? ` (${activeSubsCount})` : ""}`}
              >
                {() => (
                  <>
                    <DropdownItem
                      active={isActive && activeSubsCount === 0}
                      onClick={() => toggleCategory(c.slug)}
                    >
                      <span className="flex items-center justify-between">
                        All {c.name}
                        {isActive && activeSubsCount === 0 && <span>✓</span>}
                      </span>
                    </DropdownItem>
                    {subs.map((s) => {
                      const subActive = selectedSubs.includes(s.slug);
                      return (
                        <DropdownItem
                          key={s.id}
                          active={subActive}
                          onClick={() => toggleSubcategory(c.slug, s.slug)}
                        >
                          <span className="flex items-center justify-between">
                            {s.name}
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
              label={search.age ? `Ages ${search.age.replace("-", "–")}` : "Age"}
            >
              {(close) => (
                <>
                  <DropdownItem active={!search.age} onClick={() => { updateSearch({ age: undefined }); close(); }}>
                    Any age
                  </DropdownItem>
                  {AGE_BUCKETS.map((b) => {
                    const value = b.label.replace("–", "-");
                    return (
                      <DropdownItem
                        key={b.label}
                        active={search.age === value}
                        onClick={() => { updateSearch({ age: value }); close(); }}
                      >
                        Ages {b.label}
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
              label={search.price ?? "Price"}
            >
              {(close) => (
                <>
                  <DropdownItem active={!search.price} onClick={() => { updateSearch({ price: undefined }); close(); }}>
                    Any price
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

          {isFilterEnabled("district") && availableDistricts.length > 0 && (
            <DropdownChip
              active={!!search.district}
              label={search.district ?? "District"}
            >
              {(close) => (
                <>
                  <DropdownItem active={!search.district} onClick={() => { updateSearch({ district: undefined }); close(); }}>
                    All districts
                  </DropdownItem>
                  {availableDistricts.map((d) => (
                    <DropdownItem
                      key={d}
                      active={search.district === d}
                      onClick={() => { updateSearch({ district: d }); close(); }}
                    >
                      {d}
                    </DropdownItem>
                  ))}
                </>
              )}
            </DropdownChip>
          )}
        </div>
      </div>

      <div className="px-4 pb-6 pt-2">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {results === null ? "Searching..." : `${results.length} results`}
          </p>
          <div className="inline-flex rounded-full bg-surface-soft p-1">
            <button
              onClick={() => setMode("list")}
              className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition", mode === "list" ? "bg-foreground text-background shadow-pop" : "text-muted-foreground")}
            ><List className="h-3.5 w-3.5" /> List</button>
            <button
              onClick={() => setMode("map")}
              className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition", mode === "map" ? "bg-foreground text-background shadow-pop" : "text-muted-foreground")}
            ><MapIcon className="h-3.5 w-3.5" /> Map</button>
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
    </AppShell>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
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
  label: string;
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