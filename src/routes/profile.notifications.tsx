import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notifications — activoo" },
      { name: "description", content: "Track replies from schools to the requests you sent on activoo." },
      { property: "og:title", content: "Notifications — activoo" },
      { property: "og:description", content: "Replies from schools to your requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

interface Row {
  id: string;
  class_id: string;
  status: "new" | "contacted" | "closed";
  message: string | null;
  created_at: string;
  classes: { title: string } | null;
  schools: { name: string; slug: string } | null;
}

const statusCopy: Record<Row["status"], { label: string; tone: string }> = {
  new: { label: "Sent — waiting for reply", tone: "bg-surface-soft text-foreground/70" },
  contacted: { label: "School replied to you", tone: "bg-primary/25 text-primary-strong" },
  closed: { label: "Closed by the school", tone: "bg-surface-soft text-muted-foreground" },
};

function NotificationsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    supabase
      .from("leads")
      .select("id,class_id,status,message,created_at,classes(title),schools(name,slug)")
      .eq("parent_user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data as unknown as Row[]) ?? []));
  }, [user, loading, navigate]);

  if (!user) return null;

  return (
    <AppShell hideViewTabs>
      <div className="px-4 pb-10 pt-5">
        <button onClick={() => navigate({ to: "/profile" })} className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">
          <Bell className="h-6 w-6" /> Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Replies from schools to the requests you sent.</p>

        {rows.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-surface-soft p-6 text-center text-sm text-muted-foreground">
            No notifications yet. Send a request to a club and the school's reply will appear here.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-2xl bg-surface p-4 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold">{r.classes?.title ?? "Club"}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCopy[r.status].tone}`}>
                    {statusCopy[r.status].label}
                  </span>
                </div>
                {r.schools && (
                  <Link to="/schools/$slug" params={{ slug: r.schools.slug }} className="mt-1 block text-xs font-semibold text-primary-strong">
                    {r.schools.name}
                  </Link>
                )}
                {r.message && <p className="mt-2 text-sm text-foreground/75">{r.message}</p>}
                <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
