import { Link } from "@tanstack/react-router";
import { Star, MapPin, ImageOff } from "lucide-react";
import { useState } from "react";
import { CATEGORIES, classImage, type CategoryKey } from "@/lib/categories";
import { useI18n, useTranslated } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface ClassRow {
  id: string;
  title: string;
  category: CategoryKey;
  age_min: number;
  age_max: number;
  price_from: number;
  image_url: string | null;
  is_new?: boolean | null;
  schools?: { name?: string | null; district?: string | null; rating?: number | null } | null;
}

interface Props {
  cls: ClassRow;
  variant?: "default" | "wide" | "compact";
}

export function ClassCard({ cls, variant = "default" }: Props) {
  const { lang, t } = useI18n();
  const cat = CATEGORIES[cls.category];
  const initialImg = classImage(cls.category, cls.image_url ?? undefined);

  // State ფოტოს ჩატვირთვის ერორის სამართავად
  const [imgError, setImgError] = useState(false);

  const rating = cls.schools?.rating ?? 5;
  const title = useTranslated(cls.title);
  const schoolName = useTranslated(cls.schools?.name ?? "");
  const district = useTranslated(cls.schools?.district ?? "");

  const widthCls =
    variant === "wide"
      ? "w-[72vw] max-w-[18rem] md:w-full md:max-w-none"
      : variant === "compact"
        ? "w-full"
        : "w-[60vw] max-w-[15rem] md:w-full md:max-w-none";

  return (
    <Link
      to="/class/$id"
      params={{ id: cls.id }}
      className={cn(
        "group relative flex shrink-0 flex-col overflow-hidden rounded-3xl bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated",
        widthCls
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {/* თუ ფოტო ერორს აგდებს ან არ არსებობს, ვაჩვენებთ Fallback იკონს */}
        {imgError || !initialImg ? (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <ImageOff className="h-8 w-8 opacity-40" />
          </div>
        ) : (
          <img
            src={initialImg}
            alt={cls.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}

        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
          <span>{cat?.emoji}</span>
          <span>{cat ? t(cat.labelKey) : ""}</span>
        </div>

        {cls.is_new && (
          <span className="absolute right-3 top-3 rounded-full bg-accent-strong px-2.5 py-1 text-xs font-bold text-foreground shadow-soft">
            NEW
          </span>
        )}

        <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-foreground/85 px-2 py-1 text-xs font-semibold text-background backdrop-blur">
          <Star className="h-3 w-3 fill-current text-accent-strong" />
          {rating?.toFixed?.(1) ?? "5.0"}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 text-base font-bold text-foreground">{title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">
            {schoolName} • {district}
          </span>
        </div>
        <div className="mt-1 flex items-end justify-between">
          <span className="text-xs text-muted-foreground">
            {lang === "ka" ? `ასაკი ${cls.age_min}–${cls.age_max}` : `Ages ${cls.age_min}–${cls.age_max}`}
          </span>
          <span className="text-sm font-bold text-foreground">
            {lang === "ka" ? "დან " : "from "}
            <span className="text-primary-strong">{cls.price_from} ₾</span>
          </span>
        </div>
      </div>
    </Link>
  );
}