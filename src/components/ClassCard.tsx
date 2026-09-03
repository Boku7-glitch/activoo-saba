import { Link } from "@tanstack/react-router";
import { Star, MapPin } from "lucide-react";
import { CATEGORIES, classImage, type CategoryKey } from "@/lib/categories";
import { useI18n, useLocalized, useTranslated } from "@/lib/i18n";
import { formatLocation } from "@/lib/locations";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { NewBadge } from "@/components/NewBadge";

export interface ClassRow {
  id: string;
  title: string;
  title_en?: string | null;
  category: CategoryKey;
  age_min: number;
  age_max: number;
  price_from: number;
  image_url: string | null;
  is_new?: boolean | null;
  schools?: {
    name?: string | null;
    name_en?: string | null;
    district?: string | null;
    district_en?: string | null;
    city?: string | null;
    city_en?: string | null;
    rating?: number | null;
    verified?: boolean | null;
  } | null;
}

interface Props {
  cls: ClassRow;
  variant?: "default" | "wide" | "compact";
}

export function ClassCard({ cls, variant = "default" }: Props) {
  const { lang, t } = useI18n();
  const cat = CATEGORIES[cls.category];
  const img = classImage(cls.category, cls.image_url ?? undefined);
  const rating = cls.schools?.rating ?? 5;
  // Prefer admin-provided English; fall back to AI-translated Georgian.
  const adminEnTitle = (cls.title_en ?? "").trim();
  const aiTitle = useTranslated(cls.title);
  const title = lang === "en" && adminEnTitle ? adminEnTitle : aiTitle;
  const schoolName = useLocalized(cls.schools?.name ?? "", cls.schools?.name_en);
  const districtEn = (cls.schools?.district_en ?? "").trim();
  const aiDistrict = useTranslated(cls.schools?.district ?? "");
  const district = lang === "en" && districtEn ? districtEn : aiDistrict;
  const cityEn = (cls.schools?.city_en ?? "").trim();
  const aiCity = useTranslated(cls.schools?.city ?? "");
  const city = lang === "en" && cityEn ? cityEn : aiCity;
  const location = formatLocation(city, district);
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
        <img
          src={img}
          alt={cls.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
          <span>{cat.emoji}</span>
          <span>{t(cat.labelKey)}</span>
        </div>
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          {cls.schools?.verified && (
            <VerifiedBadge size="sm" />
          )}
          {cls.is_new && (
            <NewBadge size="sm" />
          )}
        </div>
        <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-foreground/85 px-2 py-1 text-xs font-semibold text-background backdrop-blur">
          <Star className="h-3 w-3 fill-current text-accent-strong" />
          {rating?.toFixed?.(1) ?? "5.0"}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 text-base font-bold text-foreground">{title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {schoolName}{location ? ` • ${location}` : ""}
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
