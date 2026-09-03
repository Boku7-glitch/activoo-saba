import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "parent" | "school" | "admin";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  roles: AppRole[];
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRole = async (uid: string | undefined) => {
    if (!uid) { setRole(null); setRoles([]); return; }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    let list = (data ?? []).map((r) => r.role as AppRole);
    // Apply role chosen at sign-up once the email is confirmed and a session exists
    if (list.length === 0 && typeof window !== "undefined") {
      const pending = window.localStorage.getItem("activoo_pending_role");
      if (pending === "parent" || pending === "school") {
        const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: pending });
        window.localStorage.removeItem("activoo_pending_role");
        if (!error) list = [pending];
      }
    }
    setRoles(list);
    // Prefer admin > school > parent for primary "role" used in routing
    const primary: AppRole | null = list.includes("admin")
      ? "admin"
      : list.includes("school")
        ? "school"
        : list.includes("parent")
          ? "parent"
          : null;
    setRole(primary);

    // Enforce moderation: blocked or deleted users cannot stay signed in
    if (!list.includes("admin")) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("blocked_at, deleted_at, block_reason, delete_reason")
        .eq("id", uid)
        .maybeSingle();
      const p = prof as any;
      if (p && (p.blocked_at || p.deleted_at)) {
        const reason = p.block_reason || p.delete_reason;
        await supabase.auth.signOut();
        setRole(null);
        setRoles([]);
        if (typeof window !== "undefined") {
          const { toast } = await import("sonner");
          toast.error(
            p.deleted_at ? "Your account has been removed." : "Your account has been blocked.",
            { description: reason || "Contact support if you think this is a mistake." },
          );
        }
      }
    }
  };


  useEffect(() => {
    // 1. Subscribe FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // defer supabase calls to avoid deadlock
      setTimeout(() => { loadRole(newSession?.user?.id); }, 0);
    });
    // 2. Then read existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      loadRole(s?.user?.id).finally(() => setLoading(false));
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setRoles([]);
  };

  const refreshRole = async () => { await loadRole(user?.id); };

  const isAdmin = roles.includes("admin");

  return (
    <AuthContext.Provider value={{ user, session, role, roles, isAdmin, loading, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
