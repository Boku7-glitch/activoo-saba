import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

interface UserRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  roles: string[];
}

function AdminUsers() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });
    const merged: UserRow[] = (profiles ?? []).map((p: any) => ({
      ...p,
      roles: roleMap.get(p.id) ?? [],
    }));
    setRows(merged);
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

  const removeProfile = async (id: string) => {
    if (id === me?.id) return toast.error("You cannot delete your own account here.");
    if (!confirm("Delete this user's profile? Their auth account will remain (must be removed from Cloud → Users).")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Profile deleted");
    load();
  };

  const filtered = rows?.filter((r) =>
    !search ||
    (r.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (r.phone ?? "").includes(search)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">{rows?.length ?? 0} registered user(s). Toggle roles to grant access.</p>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone…" className="h-11 w-full max-w-sm rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary" />

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-soft text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Roles</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!filtered ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="hover:bg-surface-soft/50">
                  <td className="px-4 py-3 font-medium">
                    {u.full_name || <span className="text-muted-foreground">No name</span>}
                    {u.id === me?.id && <span className="ml-2 rounded-full bg-primary/30 px-1.5 py-0.5 text-[10px] font-bold text-primary-strong">YOU</span>}
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
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => removeProfile(u.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
