import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="flex items-end justify-between px-4 pb-2 pt-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Link
          to={href}
          className="flex items-center gap-0.5 text-sm font-semibold text-primary-strong hover:underline"
        >
          See all <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
