import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/leads")({
  component: AdminLeads,
});

interface Lead {
  id: string;
  parent_name: string;
  parent_phone: string;
  child_age: number | null;
  message: string | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
  classes?: { title: string } | null;
  schools?: { name: string } | null;
}

function AdminLeads() {
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState<string>("");

  const load = async () => {
    let query = supabase.from("leads").select("*, classes(title), schools(name)").order("created_at", { ascending: false });
    if (filter) query = query.eq("status", filter as any);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("leads").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const exportCsv = () => {
    if (!rows?.length) return toast.error("No leads to export");
    const header = ["Date", "Parent", "Phone", "Child age", "Class", "School", "Status", "Message"];
    const lines = rows.map((r) => [
      new Date(r.created_at).toISOString(),
      r.parent_name,
      r.parent_phone,
      r.child_age ?? "",
      r.classes?.title ?? "",
      r.schools?.name ?? "",
      r.status,
      (r.message ?? "").replace(/\n/g, " "),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `activoo-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">{rows?.length ?? 0} parent enquiry(ies).</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-bold text-background shadow-pop hover:opacity-90">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="flex gap-2">
        {[{ v: "", l: "All" }, { v: "new", l: "New" }, { v: "contacted", l: "Contacted" }, { v: "closed", l: "Closed" }].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${filter === f.v ? "bg-foreground text-background" : "bg-surface text-foreground/70 hover:bg-surface-soft"}`}>
            {f.l}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-soft text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Parent</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Child age</th>
                <th className="px-4 py-3 text-left">Class</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!rows ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No leads yet.</td></tr>
              ) : rows.map((l) => (
                <tr key={l.id} className="hover:bg-surface-soft/50">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{l.parent_name}</td>
                  <td className="px-4 py-3"><a href={`tel:${l.parent_phone}`} className="text-primary-strong">{l.parent_phone}</a></td>
                  <td className="px-4 py-3">{l.child_age ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.classes?.title ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{l.schools?.name ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={l.status} onChange={(e) => updateStatus(l.id, e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold">
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(l.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message details on click */}
      {rows && rows.some((r) => r.message) && (
        <details className="rounded-2xl border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold">View messages</summary>
          <ul className="mt-3 space-y-3 text-sm">
            {rows.filter((r) => r.message).map((r) => (
              <li key={r.id} className="rounded-xl bg-surface-soft p-3">
                <div className="mb-1 text-xs font-semibold">{r.parent_name} · {r.classes?.title}</div>
                <p className="text-foreground/80">{r.message}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
