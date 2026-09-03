import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface NewBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function NewBadge({
  size = "md",
  showText = true,
  className,
}: NewBadgeProps) {
  const { lang } = useI18n();
  const iconSize = size === "lg" ? 16 : size === "md" ? 12 : 10;
  const label = lang === "ka" ? "ახალი" : "NEW";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-success font-bold text-success-foreground shadow-soft",
        size === "lg" && "px-3 py-1.5 text-sm",
        size === "md" && "px-2.5 py-1 text-xs",
        size === "sm" && "px-1.5 py-0.5 text-[10px]",
        className
      )}
      aria-label={label}
    >
      <Sparkles
        className="shrink-0"
        style={{ width: iconSize, height: iconSize }}
      />
      {showText && <span>{label}</span>}
    </span>
  );
}
