import { useView } from "@/lib/view-context";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ViewTabs({ variant = "default" }: { variant?: "default" | "onHero" } = {}) {
  const { views, activeView, setActiveViewSlug, loading } = useView();
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
            <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            {v.name}
          </button>
        );
      })}
    </div>
  );
}
