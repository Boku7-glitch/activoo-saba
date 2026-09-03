import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";
import { AutoTranslateButton, TranslateInline } from "@/components/AutoTranslate";


export const Route = createFileRoute("/admin/nav")({
  component: AdminNav,
});

type Location = "header" | "footer" | "social";

interface NavRow {
  id: string;
  location: Location;
  group_ka: string | null;
  group_en: string | null;
  label_ka: string;
  label_en: string | null;
  href: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
}

const TABS: { id: Location; title: string; hint: string }[] = [
  { id: "header", title: "Header", hint: "Main links across the top navigation." },
  { id: "footer", title: "Footer", hint: "Links shown in the site footer." },
  { id: "social", title: "Social", hint: "Social icons (Instagram, Facebook…). Use the icon field for the platform name." },
];

function AdminNav() {
  const [rows, setRows] = useState<NavRow[]>([]);
  const [activeTab, setActiveTab] = useState<Location>("header");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase.from("nav_items").select("*").order("location").order("sort_order");
    if (error) toast.error(error.message);
    setRows((data as NavRow[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const currentRows = rows.filter((r) => r.location === activeTab).sort((a, b) => a.sort_order - b.sort_order);

  const updateRow = (id: string, patch: Partial<NavRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const move = (id: string, dir: -1 | 1) => {
    const list = [...currentRows];
    const idx = list.findIndex((r) => r.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;
    const a = list[idx];
    const b = list[swap];
    updateRow(a.id, { sort_order: b.sort_order });
    updateRow(b.id, { sort_order: a.sort_order });
  };

  const addRow = () => {
    const tmpId = `tmp-${Date.now()}`;
    const nextOrder = (currentRows[currentRows.length - 1]?.sort_order ?? 0) + 1;
    setRows((prev) => [
      ...prev,
      {
        id: tmpId,
        location: activeTab,
        group_ka: null,
        group_en: null,
        label_ka: "",
        label_en: "",
        href: "/",
        icon: null,
        sort_order: nextOrder,
        is_visible: true,
      },
    ]);
  };

  const removeRow = async (id: string) => {
    if (!id.startsWith("tmp-")) {
      const { error } = await supabase.from("nav_items").delete().eq("id", id);
      if (error) return toast.error(error.message);
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Removed");
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Split into inserts (tmp-*) and updates
      const toInsert = rows
        .filter((r) => r.id.startsWith("tmp-"))
        .map(({ id: _id, ...rest }) => rest);
      const toUpdate = rows.filter((r) => !r.id.startsWith("tmp-"));

      if (toInsert.length > 0) {
        const { error } = await supabase.from("nav_items").insert(toInsert);
        if (error) throw error;
      }
      for (const r of toUpdate) {
        const { id, ...patch } = r;
        const { error } = await supabase.from("nav_items").update(patch).eq("id", id);
        if (error) throw error;
      }
      toast.success("Navigation saved");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Navigation</h1>
          <p className="text-sm text-muted-foreground">Edit header, footer and social links in Georgian and English.</p>
        </div>
        <div className="flex items-center gap-2">
          <AutoTranslateButton
            label="Auto-translate labels"
            pairs={() =>
              currentRows.map((r) => ({
                source: r.label_ka,
                value: r.label_en,
                apply: (v: string) => updateRow(r.id, { label_en: v }),
              }))
            }
          />
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-bold text-background shadow-pop disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === t.id ? "bg-foreground text-background shadow-pop" : "bg-surface text-foreground hover:bg-surface-soft"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">{currentTab.title}</h2>
            <p className="text-xs text-muted-foreground">{currentTab.hint}</p>
          </div>
          <button
            onClick={addRow}
            className="flex items-center gap-1 rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary-strong hover:bg-primary/30"
          >
            <Plus className="h-3.5 w-3.5" /> Add link
          </button>
        </div>

        <div className="space-y-3">
          {currentRows.length === 0 && (
            <div className="rounded-xl bg-surface-soft p-6 text-center text-sm text-muted-foreground">
              No links yet. Click "Add link" to create one.
            </div>
          )}
          {currentRows.map((r, i) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-background/50 p-3">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Label (KA)</span>
                  <input
                    value={r.label_ka}
                    onChange={(e) => updateRow(r.id, { label_ka: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Label (EN)</span>
                  <div className="flex items-center gap-1">
                    <input
                      value={r.label_en ?? ""}
                      onChange={(e) => updateRow(r.id, { label_en: e.target.value })}
                      placeholder="falls back to KA"
                      className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                    />
                    <TranslateInline source={r.label_ka} onResult={(t) => updateRow(r.id, { label_en: t })} />
                  </div>

                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">URL / Path</span>
                  <input
                    value={r.href}
                    onChange={(e) => updateRow(r.id, { href: e.target.value })}
                    placeholder="/search"
                    className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                  />
                </label>
                <div className="flex items-end gap-1">
                  <button
                    onClick={() => move(r.id, -1)}
                    disabled={i === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted disabled:opacity-30"
                    aria-label="Move up"
                  ><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button
                    onClick={() => move(r.id, 1)}
                    disabled={i === currentRows.length - 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted disabled:opacity-30"
                    aria-label="Move down"
                  ><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button
                    onClick={() => removeRow(r.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                    aria-label="Delete"
                  ><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {activeTab === "social" && (
                <label className="mt-2 block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Icon name</span>
                  <input
                    value={r.icon ?? ""}
                    onChange={(e) => updateRow(r.id, { icon: e.target.value })}
                    placeholder="instagram / facebook / telegram / x"
                    className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                  />
                </label>
              )}
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={r.is_visible}
                  onChange={(e) => updateRow(r.id, { is_visible: e.target.checked })}
                />
                Visible on site
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
