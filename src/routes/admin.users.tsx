import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ban, History, RotateCcw, Trash2, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

interface UserRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  blocked_at: string | null;
  block_reason: string | null;
  deleted_at: string | null;
  delete_reason: string | null;
  roles: string[];
}

interface LogRow {
  id: string;
  user_id: string;
  action: string;
  reason: string | null;
  created_at: string;
}

type Tab = "active" | "blocked" | "deleted";
type ActionKind = "block" | "unblock" | "delete" | "restore" | "note";

const ACTION_LABEL: Record<ActionKind, string> = {
  block: "Block user",
  unblock: "Unblock user",
  delete: "Delete user",
  restore: "Restore user",
  note: "Add note",
};

function AdminUsers() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("active");
  const [dialog, setDialog] = useState<{ user: UserRow; action: ActionKind } | null>(null);
  const [reason, setReason] = useState("");
  const [historyFor, setHistoryFor] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: profiles }, { data: roles }, { data: log }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, phone, created_at, blocked_at, block_reason, deleted_at, delete_reason")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase
        .from("user_moderation_log" as any)
        .select("id, user_id, action, reason, created_at")
        .order("created_at", { ascending: false }),
    ]);
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });
    const merged: UserRow[] = ((profiles ?? []) as any[]).map((p: any) => ({
      ...p,
      roles: roleMap.get(p.id) ?? [],
    }));
    setRows(merged);
    setLogs((log ?? []) as unknown as LogRow[]);
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (userId: string, role: "parent" | "school" | "admin", has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Roles updated");
    load();
  };

  const openDialog = (user: UserRow, action: ActionKind) => {
    if (user.id === me?.id && action !== "note") {
      toast.error("You cannot moderate your own account.");
      return;
    }
    setReason("");
    setDialog({ user, action });
  };

  const submit = async () => {
    if (!dialog) return;
    const { user, action } = dialog;
    if ((action === "block" || action === "delete") && !reason.trim()) {
      toast.error("Please describe why (this note is kept in the history).");
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const patch: Record<string, any> =
      action === "block"
        ? { blocked_at: now, blocked_by: me?.id ?? null, block_reason: reason.trim() }
        : action === "unblock"
          ? { blocked_at: null, blocked_by: null, block_reason: null }
          : action === "delete"
            ? { deleted_at: now, deleted_by: me?.id ?? null, delete_reason: reason.trim() }
            : action === "restore"
              ? { deleted_at: null, deleted_by: null, delete_reason: null }
              : {};

    if (Object.keys(patch).length) {
      const { error } = await supabase.from("profiles").update(patch as never).eq("id", user.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    const { error: logErr } = await supabase.from("user_moderation_log" as any).insert({
      user_id: user.id,
      action,
      reason: reason.trim() || null,
      actor_id: me?.id ?? null,
    } as any);
    setSaving(false);
    if (logErr) return toast.error(logErr.message);
    toast.success(`${ACTION_LABEL[action]} — done`);
    setDialog(null);
    load();
  };

  const filtered = useMemo(() => {
    if (!rows) return null;
    return rows.filter((r) => {
      const inTab =
        tab === "deleted" ? !!r.deleted_at
          : tab === "blocked" ? !!r.blocked_at && !r.deleted_at
            : !r.blocked_at && !r.deleted_at;
      if (!inTab) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (r.full_name ?? "").toLowerCase().includes(q) || (r.phone ?? "").includes(search) || r.id.includes(search);
    });
  }, [rows, tab, search]);

  const counts = {
    active: rows?.filter((r) => !r.blocked_at && !r.deleted_at).length ?? 0,
    blocked: rows?.filter((r) => r.blocked_at && !r.deleted_at).length ?? 0,
    deleted: rows?.filter((r) => r.deleted_at).length ?? 0,
  };

  const historyRows = historyFor ? logs.filter((l) => l.user_id === historyFor.id) : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Block or delete users who break the Terms &amp; Conditions. Nothing is erased — every action is stored with your note.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["active", "blocked", "deleted"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${tab === t ? "bg-foreground text-background" : "bg-surface-soft text-muted-foreground hover:bg-primary/20"}`}
          >
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, phone or ID…"
        className="h-11 w-full max-w-sm rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-soft text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Roles</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!filtered ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="hover:bg-surface-soft/50">
                  <td className="px-4 py-3 font-medium">
                    {u.full_name || <span className="text-muted-foreground">No name</span>}
                    {u.id === me?.id && <span className="ml-2 rounded-full bg-primary/30 px-1.5 py-0.5 text-[10px] font-bold text-primary-strong">YOU</span>}
                    <div className="font-mono text-[10px] text-muted-foreground">{u.id}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.phone || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(["parent", "school", "admin"] as const).map((r) => {
                        const has = u.roles.includes(r);
                        return (
                          <button
                            key={r}
                            onClick={() => toggleRole(u.id, r, has)}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${has ? (r === "admin" ? "bg-foreground text-background" : "bg-primary/30 text-primary-strong") : "bg-surface-soft text-muted-foreground hover:bg-primary/20"}`}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {u.deleted_at ? (
                      <div>
                        <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-semibold text-destructive">Deleted</span>
                        {u.delete_reason && <div className="mt-1 max-w-[220px] text-muted-foreground">{u.delete_reason}</div>}
                      </div>
                    ) : u.blocked_at ? (
                      <div>
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-600">Blocked</span>
                        {u.block_reason && <div className="mt-1 max-w-[220px] text-muted-foreground">{u.block_reason}</div>}
                      </div>
                    ) : (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-600">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button title="History" onClick={() => setHistoryFor(u)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-soft">
                        <History className="h-4 w-4" />
                      </button>
                      {u.blocked_at ? (
                        <button title="Unblock" onClick={() => openDialog(u, "unblock")} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/10">
                          <RotateCcw className="h-4 w-4" /> Unblock
                        </button>
                      ) : !u.deleted_at && (
                        <button title="Block" onClick={() => openDialog(u, "block")} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-amber-600 hover:bg-amber-500/10">
                          <Ban className="h-4 w-4" /> Block
                        </button>
                      )}
                      {u.deleted_at ? (
                        <button title="Restore" onClick={() => openDialog(u, "restore")} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary-strong hover:bg-primary/10">
                          <RotateCcw className="h-4 w-4" /> Restore
                        </button>
                      ) : (
                        <button title="Delete" onClick={() => openDialog(u, "delete")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action dialog */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => !saving && setDialog(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{ACTION_LABEL[dialog.action]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {dialog.user.full_name || dialog.user.id}
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase text-muted-foreground">
              Note {(dialog.action === "block" || dialog.action === "delete") && <span className="text-destructive">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Why is this user being moderated? (T&C violation, spam, abuse…)"
              className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDialog(null)} disabled={saving} className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface-soft">Cancel</button>
              <button onClick={submit} disabled={saving} className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-60">
                {saving ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History drawer */}
      {historyFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setHistoryFor(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">Moderation history</h2>
                <p className="text-sm text-muted-foreground">{historyFor.full_name || historyFor.id}</p>
              </div>
              <button onClick={() => setHistoryFor(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-surface-soft"><X className="h-4 w-4" /></button>
            </div>
            <button
              onClick={() => { const u = historyFor; setHistoryFor(null); openDialog(u, "note"); }}
              className="mt-3 rounded-xl bg-surface-soft px-3 py-2 text-xs font-semibold hover:bg-primary/20"
            >
              + Add note
            </button>
            <div className="mt-4 space-y-3">
              {historyRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No moderation actions yet.</p>
              ) : historyRows.map((l) => (
                <div key={l.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold capitalize">{l.action}</span>
                    <span className="text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                  </div>
                  {l.reason && <p className="mt-1 text-sm">{l.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
