import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Search, Heart, User, LayoutDashboard, LogIn, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ViewTabs } from "@/components/ViewTabs";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Hide the bottom tab bar (e.g. on auth or wizard screens) */
  hideTabBar?: boolean;
  /** Hide the top header */
  hideHeader?: boolean;
  /** Hide the view tabs row inside header (e.g. when page renders its own tabs) */
  hideViewTabs?: boolean;
}

export function AppShell({ children, hideTabBar, hideHeader, hideViewTabs }: Props) {
  const { user, role, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const accountTo = user ? (role === "school" ? "/school/dashboard" : "/profile") : "/auth";
  const savedTo = role === "school" ? "/school/dashboard" : "/profile/saved";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-elevated md:max-w-none md:shadow-none">
      {/* Mobile header */}
      {!hideHeader && (
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center">
              <Logo height={36} />
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />

              {/* Mobile Admin Quick Access Link */}
              {isAdmin && (
                <Link
                  to="/admin"
                  aria-label="Admin Dashboard"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90"
                >
                  <ShieldCheck className="h-5 w-5" />
                </Link>
              )}

              <button
                type="button"
                aria-label={t("common.account")}
                onClick={() => navigate({ to: accountTo })}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-foreground transition hover:bg-primary/30"
              >
                {user ? <User className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {!hideViewTabs && <ViewTabs />}
        </header>
      )}

      {/* Desktop header — always shown on md+ */}
      <header className="sticky top-0 z-30 hidden border-b border-border/60 bg-background/85 backdrop-blur-xl md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <Logo height={38} />
            </Link>
            <Link
              to="/search"
              aria-label={t("common.search")}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition",
                isActive("/search")
                  ? "bg-foreground text-background"
                  : "bg-surface-soft text-foreground hover:bg-primary/30"
              )}
            >
              <Search className="h-5 w-5" />
            </Link>
          </div>
          <nav className="flex items-center">
            <ViewTabs />
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="pill" />

            {/* Desktop Admin Link */}
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}

            {user ? (
              <Link
                to={accountTo}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
              >
                <User className="h-4 w-4" /> {t("common.account")}
              </Link>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
              >
                <LogIn className="h-4 w-4" /> {t("common.signIn")}
              </Link>
            )}
          </div>
        </div>
        {!hideViewTabs && (
          <div className="border-t border-border/40 md:hidden">
            <div className="mx-auto max-w-7xl">
              <ViewTabs />
            </div>
          </div>
        )}
      </header>

      <main className={cn("flex-1", !hideTabBar && "pb-24 md:pb-12")}>
        <div className="md:mx-auto md:w-full md:max-w-7xl md:px-8">{children}</div>
      </main>

      {/* Mobile bottom tab bar — hidden on desktop */}
      {!hideTabBar && (
        <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-[26rem] -translate-x-1/2 rounded-3xl bg-foreground/95 px-2 py-2 shadow-elevated backdrop-blur-xl md:hidden">
          <ul className="grid grid-cols-3 gap-1">
            <TabItem to="/search" icon={<Search className="h-5 w-5" />} label={t("common.search")} active={isActive("/search")} />
            <TabItem
              to={savedTo}
              icon={role === "school" ? <LayoutDashboard className="h-5 w-5" /> : <Heart className="h-5 w-5" />}
              label={role === "school" ? t("common.dashboard") : t("common.saved")}
              active={isActive(role === "school" ? "/school" : "/profile/saved")}
            />
            <TabItem
              to={accountTo}
              icon={<User className="h-5 w-5" />}
              label={user ? t("common.profile") : t("common.signIn")}
              active={isActive("/profile") || isActive("/auth")}
            />
          </ul>
        </nav>
      )}

      {/* Desktop footer */}
      <footer className="hidden border-t border-border/60 bg-surface-soft md:block">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-8 py-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Logo height={20} />
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} activoo. All rights reserved.</span>
          </div>
          <nav className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">{t("common.home")}</Link>
            <Link to="/search" className="hover:text-foreground">{t("common.search")}</Link>
            <Link to="/match" className="hover:text-foreground">{t("common.smartMatch")}</Link>
            <Link to="/school/onboarding" className="hover:text-foreground">{t("common.forSchools")}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function DesktopLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold transition",
        active ? "bg-foreground text-background" : "text-foreground/70 hover:bg-surface-soft hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

function TabItem({
                   to,
                   icon,
                   label,
                   active,
                 }: {
  to: string;
  icon: ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        className={cn(
          "flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-xs font-medium transition",
          active
            ? "bg-primary text-primary-foreground shadow-pop"
            : "text-background/70 hover:text-background"
        )}
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
}