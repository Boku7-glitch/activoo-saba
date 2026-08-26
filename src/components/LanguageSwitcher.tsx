import { useI18n, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** "compact" = only flag/code button toggle; "pill" = two-segment pill */
  variant?: "compact" | "pill";
}

export function LanguageSwitcher({ className, variant = "compact" }: Props) {
  const { lang, setLang } = useI18n();

  if (variant === "pill") {
    return (
      <div className={cn("inline-flex items-center rounded-full bg-surface-soft p-0.5 text-xs font-bold", className)}>
        <Btn current={lang} target="ka" onClick={() => setLang("ka")} label="ქარ" />
        <Btn current={lang} target="en" onClick={() => setLang("en")} label="EN" />
      </div>
    );
  }

  const next: Lang = lang === "ka" ? "en" : "ka";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={lang === "ka" ? "Switch to English" : "გადართვა ქართულზე"}
      className={cn(
        "flex h-10 min-w-10 items-center justify-center gap-1 rounded-full bg-surface-soft px-3 text-xs font-bold text-foreground transition hover:bg-primary/30",
        className,
      )}
    >
      {lang === "ka" ? "ქარ" : "EN"}
    </button>
  );
}

function Btn({ current, target, onClick, label }: { current: Lang; target: Lang; onClick: () => void; label: string }) {
  const active = current === target;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 transition",
        active ? "bg-foreground text-background shadow-pop" : "text-foreground/60 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
