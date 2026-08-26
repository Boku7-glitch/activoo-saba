import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { LayoutDashboard, School, BookOpen, Inbox, Users, Settings, LogOut, ArrowLeft, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({
    meta: [
      { title: "Admin — activoo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type NavItem = { to: "/admin" | "/admin/schools" | "/admin/classes" | "/admin/leads" | "/admin/users" | "/admin/views" | "/admin/settings"; label: string; icon: typeof LayoutDashboard; exact?: boolean };

const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/views", label: "Views", icon: Layers },
  { to: "/admin/schools", label: "Schools", icon: School },
  { to: "/admin/classes", label: "Classes", icon: BookOpen },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/settings", label: "Site copy", icon: Settings },
];

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    // Don't bounce away from the admin login page itself
    if (location.pathname === "/admin/login") return;
    if (!user || !isAdmin) {
      navigate({ to: "/admin/login" });
    }
  }, [user, isAdmin, loading, navigate, location.pathname]);

  // Render the login page bare (no admin chrome)
  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Checking access…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <Logo height={20} />
          <span className="rounded-full bg-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-strong">
            Admin
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-foreground text-background shadow-soft"
                    : "text-foreground/70 hover:bg-surface-soft hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-surface-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
          <button
            onClick={() => { signOut(); navigate({ to: "/" }); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-surface-soft"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <Logo height={15} />
            <span className="rounded-full bg-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase text-primary-strong">Admin</span>
          </div>
          <Link to="/" className="text-xs font-semibold text-primary-strong">View site</Link>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center justify-around border-t border-border bg-surface md:hidden">
          {NAV.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold",
                  active ? "text-primary-strong" : "text-foreground/60"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
