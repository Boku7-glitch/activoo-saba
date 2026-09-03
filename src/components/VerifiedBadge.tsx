import { BadgeCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  variant?: "pill" | "icon";
}

export function VerifiedBadge({
  size = "md",
  showText = true,
  className,
  variant = "pill",
}: VerifiedBadgeProps) {
  const iconSize = size === "lg" ? 18 : size === "md" ? 14 : 10;

  if (variant === "icon") {
    return (
      <BadgeCheck
        className={cn("shrink-0 fill-primary text-background", size === "lg" && "h-6 w-6", size === "md" && "h-5 w-5", size === "sm" && "h-4 w-4", className)}
        aria-label="Verified school"
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-primary font-bold text-primary-foreground shadow-soft",
        size === "lg" && "px-3 py-1.5 text-sm",
        size === "md" && "px-2.5 py-1 text-xs",
        size === "sm" && "px-1.5 py-0.5 text-[10px]",
        className,
      )}
      aria-label="Verified school"
    >
      {size === "lg" ? (
        <Check className="shrink-0" style={{ width: iconSize, height: iconSize }} strokeWidth={3} />
      ) : (
        <BadgeCheck className="shrink-0" style={{ width: iconSize, height: iconSize }} />
      )}
      {showText && <span>Verified</span>}
    </span>
  );
}
