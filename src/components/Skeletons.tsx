export function ClassCardSkeleton({ wide }: { wide?: boolean }) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-3xl bg-surface shadow-soft ${
        wide ? "w-[72vw] max-w-[18rem]" : "w-[60vw] max-w-[15rem]"
      }`}
    >
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function CardRowSkeleton({ wide }: { wide?: boolean }) {
  return (
    <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2">
      {[0, 1, 2].map((i) => (
        <ClassCardSkeleton key={i} wide={wide} />
      ))}
    </div>
  );
}
