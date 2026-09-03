import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/moderation")({
  component: AdminModeration,
});

interface PendingClass {
  id: string;
  title: string;
  approval_status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  price_from: number | null;
  schools?: { name: string } | null;
}

type Tab = "pending" | "rejected" | "approved";

function AdminModeration() {
  const [tab, setTab] = useState<Tab>("pending");
  const [rows, setRows] = useState<PendingClass[] | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    const { data, error } = await supabase
      .from("classes")
      .select("id,title,approval_status,rejection_reason,created_at,updated_at,image_url,price_from,schools(name)")
      .eq("approval_status", tab)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as unknown as PendingClass[]) ?? []);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    const { error } = await supabase
      .from("classes")
      .update({ approval_status: "approved", rejection_reason: null, is_visible: true } as never)
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Club approved and published");
    load();
  };

  const reject = async (id: string) => {
    const reason = window.prompt("Reason for rejection (visible to the school):") ?? "";
    const { error } = await supabase
      .from("classes")
      .update({ approval_status: "rejected", rejection_reason: reason || null, is_visible: false } as never)
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Club rejected");
    load();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "pending", label: "Pending" },
    { id: "rejected", label: "Rejected" },
    { id: "approved", label: "Approved" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">Moderation</h1>
        <p className="text-sm text-muted-foreground">Review clubs added by schools before they go live on the site.</p>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${tab === t.id ? "bg-foreground text-background" : "bg-surface-soft"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {rows === null && <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}
      {rows?.length === 0 && (
        <div className="rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground shadow-soft">Nothing here.</div>
      )}

      <div className="space-y-2">
        {rows?.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface p-3 shadow-soft">
            {c.image_url && <img src={c.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{c.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {c.schools?.name ?? "—"} · ID {c.id.slice(0, 8)}
              </p>
              {c.rejection_reason && <p className="mt-0.5 text-xs text-destructive">Rejected: {c.rejection_reason}</p>}
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-bold">
              <Clock className="h-3 w-3" /> {new Date(c.updated_at).toLocaleDateString()}
            </span>
            <a
              href={`/class/${c.id}?preview=1`}
              target="_blank"
              rel="noreferrer"
              title="Preview page"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-soft"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {c.approval_status !== "approved" && (
              <button
                onClick={() => approve(c.id)}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
            )}
            {c.approval_status !== "rejected" && (
              <button
                onClick={() => reject(c.id)}
                className="inline-flex items-center gap-1 rounded-full bg-surface-soft px-3 py-1.5 text-xs font-bold text-destructive"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
