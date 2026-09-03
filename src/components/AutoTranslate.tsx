import { Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslator } from "@/lib/use-translate";
import { cn } from "@/lib/utils";

export interface TranslatePair {
  /** Georgian source text */
  source?: string | null;
  /** Current English value (used to skip already filled fields) */
  value?: string | null;
  /** Called with the English translation */
  apply: (v: string) => void;
}

/**
 * Bulk "translate everything to English" button.
 * By default only empty English fields are filled; the result stays fully editable.
 */
export function AutoTranslateButton({
  pairs,
  label = "Auto-translate to EN",
  overwrite = false,
  className,
  onDone,
}: {
  pairs: () => TranslatePair[];
  label?: string;
  overwrite?: boolean;
  className?: string;
  onDone?: () => void;
}) {
  const { translate, busy } = useTranslator("en");

  const run = async () => {
    const list = pairs().filter(
      (p) => (p.source ?? "").trim() && (overwrite || !(p.value ?? "").trim()),
    );
    if (list.length === 0) return toast.info("Nothing to translate — English fields are filled.");
    try {
      const results = await translate(list.map((p) => (p.source ?? "").trim()));
      results.forEach((v, i) => {
        if (v) list[i].apply(v);
      });
      toast.success(`Translated ${list.length} field${list.length > 1 ? "s" : ""} to English`);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translation failed");
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className={cn(
        "flex items-center gap-1.5 rounded-xl bg-primary/15 px-3 py-2 text-xs font-bold text-foreground transition hover:bg-primary/25 disabled:opacity-50",
        className,
      )}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
      {busy ? "Translating…" : label}
    </button>
  );
}

/** Small icon button that translates one Georgian value into an English field. */
export function TranslateInline({
  source,
  onResult,
  className,
}: {
  source?: string | null;
  onResult: (v: string) => void;
  className?: string;
}) {
  const { translate, busy } = useTranslator("en");

  const run = async () => {
    const text = (source ?? "").trim();
    if (!text) return toast.info("Fill the Georgian field first");
    try {
      const [v] = await translate([text]);
      if (v) onResult(v);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translation failed");
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      title="Translate from Georgian"
      aria-label="Translate from Georgian"
      className={cn("rounded-lg p-1 text-muted-foreground transition hover:bg-surface-soft hover:text-foreground disabled:opacity-50", className)}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
    </button>
  );
}

/** Paired Georgian + English inputs with an inline auto-translate action. */
export function BilingualField({
  label,
  ka,
  en,
  onKa,
  onEn,
  multiline,
  required,
  placeholder,
}: {
  label: string;
  ka: string;
  en: string;
  onKa: (v: string) => void;
  onEn: (v: string) => void;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
}) {
  const base = "w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary";
  return (
    <div className="md:col-span-2 grid grid-cols-1 gap-2 md:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold">
          {label} (KA){required ? " *" : ""}
        </span>
        {multiline ? (
          <textarea value={ka} onChange={(e) => onKa(e.target.value)} rows={3} placeholder={placeholder} className={cn(base, "resize-none py-2")} />
        ) : (
          <input value={ka} onChange={(e) => onKa(e.target.value)} placeholder={placeholder} className={cn(base, "h-10")} />
        )}
      </label>
      <label className="block">
        <span className="mb-1 flex items-center justify-between text-xs font-semibold">
          <span>{label} (EN)</span>
          <TranslateInline source={ka} onResult={onEn} />
        </span>
        {multiline ? (
          <textarea value={en} onChange={(e) => onEn(e.target.value)} rows={3} placeholder="Auto-translated — edit if needed" className={cn(base, "resize-none py-2")} />
        ) : (
          <input value={en} onChange={(e) => onEn(e.target.value)} placeholder="Auto-translated — edit if needed" className={cn(base, "h-10")} />
        )}
      </label>
    </div>
  );
}
