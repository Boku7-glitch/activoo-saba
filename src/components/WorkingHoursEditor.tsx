import { useMemo } from "react";

export interface DayHours {
  open: boolean;
  from: string;
  to: string;
}

export const WEEK_DAYS: { key: string; label: string }[] = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" },
  { key: "Sat", label: "Saturday" },
  { key: "Sun", label: "Sunday" },
];

const DEFAULT_DAY: DayHours = { open: false, from: "09:00", to: "18:00" };

export type WeekHours = Record<string, DayHours>;

export function emptyWeek(): WeekHours {
  return Object.fromEntries(WEEK_DAYS.map((d) => [d.key, { ...DEFAULT_DAY }]));
}

/** Serializes to a readable, re-parsable string: "Mon 09:00–18:00, Tue 09:00–18:00" */
export function serializeHours(week: WeekHours): string {
  return WEEK_DAYS.filter((d) => week[d.key]?.open)
    .map((d) => `${d.key} ${week[d.key].from}–${week[d.key].to}`)
    .join(", ");
}

/** Parses the serialized format back. Returns null when the text is free-form. */
export function parseHours(text: string | null | undefined): WeekHours | null {
  if (!text || !text.trim()) return emptyWeek();
  const week = emptyWeek();
  let matched = 0;
  for (const part of text.split(",")) {
    const m = part.trim().match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})$/i);
    if (!m) return null;
    const key = m[1][0].toUpperCase() + m[1].slice(1, 3).toLowerCase();
    week[key] = { open: true, from: m[2], to: m[3] };
    matched++;
  }
  return matched > 0 ? week : null;
}

export function WorkingHoursEditor({
  label = "Working hours",
  value,
  onChange,
}: {
  label?: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  const parsed = useMemo(() => parseHours(value), [value]);
  const week = parsed ?? emptyWeek();
  const legacy = parsed === null;

  const update = (key: string, patch: Partial<DayHours>) => {
    const next: WeekHours = { ...week, [key]: { ...week[key], ...patch } };
    onChange(serializeHours(next));
  };

  const applyToAll = (key: string) => {
    const src = week[key];
    const next: WeekHours = Object.fromEntries(
      WEEK_DAYS.map((d) => [d.key, week[d.key].open ? { ...src, open: true } : week[d.key]]),
    );
    onChange(serializeHours(next));
  };

  return (
    <div className="rounded-xl border border-border bg-background/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-[11px] text-muted-foreground">Pick days and hours (from – to)</span>
      </div>

      {legacy && (
        <p className="mb-2 rounded-lg bg-muted px-2 py-1.5 text-[11px] text-muted-foreground">
          Current value “{value}” is free text. Pick days below to replace it with a structured schedule.
        </p>
      )}

      <div className="space-y-1.5">
        {WEEK_DAYS.map((d) => {
          const day = week[d.key];
          return (
            <div key={d.key} className="flex flex-wrap items-center gap-2">
              <label className="flex w-32 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={day.open}
                  onChange={(e) => update(d.key, { open: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                <span className={day.open ? "font-semibold" : "text-muted-foreground"}>{d.label}</span>
              </label>
              <input
                type="time"
                value={day.from}
                disabled={!day.open}
                onChange={(e) => update(d.key, { from: e.target.value })}
                className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary disabled:opacity-40"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <input
                type="time"
                value={day.to}
                disabled={!day.open}
                onChange={(e) => update(d.key, { to: e.target.value })}
                className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary disabled:opacity-40"
              />
              {day.open && (
                <button
                  type="button"
                  onClick={() => applyToAll(d.key)}
                  className="rounded-lg px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-surface-soft"
                >
                  Apply to all open days
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        {serializeHours(week) || "Closed / not specified"}
      </p>
    </div>
  );
}
