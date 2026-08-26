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
    const list = (data ?? []).map((r) => r.role as AppRole);
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
  };

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        await loadRole(currentSession?.user?.id);
        setLoading(false);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        await loadRole(newSession?.user?.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
