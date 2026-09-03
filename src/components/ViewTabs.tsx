import { useView } from "@/lib/view-context";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";


const VIEW_NAMES_EN: Record<string, string> = {
  education: "Education",
  activity: "Activity",
  masterclasses: "Masterclasses",
  services: "Services",
  "განათლება": "Education",
  "აქტივობა": "Activity",
  "მასტერკლასები": "Masterclasses",
  "სერვისები": "Services",
};

const VIEW_NAMES_KA: Record<string, string> = {
  education: "განათლება",
  activity: "აქტივობა",
  masterclasses: "მასტერკლასები",
  services: "სერვისები",
  "განათლება": "განათლება",
  "აქტივობა": "აქტივობა",
  "მასტერკლასები": "მასტერკლასები",
  "სერვისები": "სერვისები",
};

export function ViewTabs({ variant = "default" }: { variant?: "default" | "onHero" } = {}) {
  const { views, activeView, setActiveViewSlug, loading } = useView();
  const { lang } = useI18n();
  if (loading || views.length === 0) return null;

  const onHero = variant === "onHero";

  return (
    <div
      className={cn(
        "py-2 md:py-3",
        onHero
          ? "grid grid-cols-2 gap-1.5 md:flex md:flex-wrap md:gap-1.5"
          : "scrollbar-hide flex gap-1.5 overflow-x-auto px-3 md:px-6",
      )}
    >
      {views.map((v) => {
        const isActive = activeView?.slug === v.slug;
        const Icon = (Icons as unknown as Record<string, LucideIcon>)[v.icon] ?? Icons.Sparkles;
        const displayName = lang === "en"
          ? (v.name_en || VIEW_NAMES_EN[v.slug] || VIEW_NAMES_EN[v.name] || v.name)
          : (VIEW_NAMES_KA[v.slug] || v.name);
        return (
          <button
            key={v.id}
            onClick={() => setActiveViewSlug(v.slug)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition md:text-sm md:px-4 md:py-2",
              onHero ? "w-full md:w-auto" : "shrink-0",
              isActive
                ? "bg-foreground text-background shadow-pop"
                : onHero
                  ? "bg-surface/60 text-foreground backdrop-blur hover:bg-surface/80"
                  : "border border-border bg-surface text-foreground hover:border-foreground/40",
            )}
          >
            {v.icon_url ? (
              <img src={v.icon_url} alt="" className="h-3.5 w-3.5 shrink-0 object-contain md:h-4 md:w-4" />
            ) : (
              <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            )}
            {displayName}
          </button>
        );
      })}
    </div>
  );
}
