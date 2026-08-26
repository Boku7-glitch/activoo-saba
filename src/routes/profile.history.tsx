import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClassCard, type ClassRow } from "@/components/ClassCard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile/history")({ component: HistoryPage });

function HistoryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ClassRow[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    supabase.from("viewed_classes")
      .select("viewed_at,classes(id,title,category,age_min,age_max,price_from,image_url,is_new,schools(name,district,rating))")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(40)
      .then(({ data }) => {
        const seen = new Set<string>();
        const rows: ClassRow[] = [];
        ((data ?? []) as Array<{ classes: ClassRow | null }>).forEach((r) => {
          if (r.classes && !seen.has(r.classes.id)) { seen.add(r.classes.id); rows.push(r.classes); }
        });
        setItems(rows);
      });
  }, [user, loading, navigate]);

  return (
    <AppShell>
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-lg font-extrabold">Viewed history</h1>
      </div>
      <div className="px-4 pb-6">
        {items === null ? <p className="text-muted-foreground">Loading…</p>
          : items.length === 0 ? (
            <div className="rounded-3xl bg-surface-soft p-8 text-center text-sm text-muted-foreground">No classes viewed yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((c) => <ClassCard key={c.id} cls={c} variant="compact" />)}
            </div>
          )}
      </div>
    </AppShell>
  );
}
