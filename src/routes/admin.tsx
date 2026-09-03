import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  School,
  BookOpen,
  Inbox,
  Users,
  Settings,
  LogOut,
  ArrowLeft,
  Layers,
  MapPin,
  Navigation as NavIcon,
  Trash2,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({
    meta: [
      { title: "Admin — activoo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type NavItem = {
  to:
    | "/admin"
    | "/admin/schools"
    | "/admin/classes"
    | "/admin/leads"
    | "/admin/users"
    | "/admin/views"
    | "/admin/locations"
    | "/admin/nav"
    | "/admin/settings"
    | "/admin/moderation"
    | "/admin/deleted";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/views", label: "Views", icon: Layers },
  { to: "/admin/schools", label: "Schools", icon: School },
  { to: "/admin/classes", label: "Classes", icon: BookOpen },
  { to: "/admin/locations", label: "Locations", icon: MapPin },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/nav", label: "Navigation", icon: NavIcon },
  { to: "/admin/settings", label: "Site copy", icon: Settings },
  { to: "/admin/moderation", label: "Moderation", icon: ShieldCheck },
  { to: "/admin/deleted", label: "Deleted", icon: Trash2 },
];

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Don't bounce away from the admin login page itself
    if (location.pathname === "/admin/login") return;
    if (!user || !isAdmin) {
      navigate({ to: "/admin/login" });
    }
  }, [user, isAdmin, loading, navigate, location.pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
      {/* Desktop Sidebar */}
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

      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface p-4 shadow-2xl transition-transform duration-300 md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Logo height={20} />
            <span className="rounded-full bg-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase text-primary-strong">
              Admin
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-soft"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto py-4">
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
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-foreground text-background shadow-soft font-bold"
                    : "text-foreground/70 hover:bg-surface-soft hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground/70 hover:bg-surface-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
          <button
            onClick={() => { signOut(); navigate({ to: "/" }); }}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground/70 hover:bg-surface-soft"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-1 text-foreground hover:bg-surface-soft"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Logo height={16} />
            <span className="rounded-full bg-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase text-primary-strong">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs font-semibold text-primary-strong hover:underline">
              View site
            </Link>
          </div>
        </header>

        {/* Mobile bottom quick nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center gap-1 overflow-x-auto border-t border-border bg-surface/95 px-2 backdrop-blur scrollbar-hide md:hidden">
          {NAV.slice(0, 6).map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold transition",
                  active ? "text-primary-strong" : "text-foreground/60"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate max-w-[60px]">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold text-foreground/60"
          >
            <Menu className="h-4 w-4" />
            <span>More</span>
          </button>
        </nav>

        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-8 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
