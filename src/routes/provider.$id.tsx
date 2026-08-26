import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Phone, Star, Users, Calendar, MapPin, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { classImage } from "@/lib/categories";
import { useT, useTranslated } from "@/lib/i18n";

export const Route = createFileRoute("/provider/$id")({
  component: ProviderDetailPage,
});

const PROVIDER_DATA = {
  id: "codekids-tbilisi",
  name: "CodeKids Tbilisi",
  initials: "co",
  location: "Saburtalo · 45 Kostava St",
  description: "Learn to code while having fun. Scratch, Python and robotics.",
  phone: "+995 555 200 200",
  stats: {
    rating: "—",
    reviewsCount: 0,
    publishedClubs: 2,
    yearsOnActivoo: "0y",
  },
  publishedClubs: [
    {
      id: "69cdccd9-0",
      title: "Scratch Coding Adventures",
      category: "IT",
      rating: 4.8,
      location: "CodeKids Tbilisi • Saburtalo",
      ageRange: "Ages 7–10",
      price: 80,
      image: classImage("it", "coding"),
      isNew: false,
    },
    {
      id: "python-robotics",
      title: "Python & Robotics",
      category: "IT",
      rating: 4.8,
      location: "CodeKids Tbilisi • Saburtalo",
      ageRange: "Ages 10–14",
      price: 120,
      image: classImage("it", "coding"),
      isNew: true,
    },
  ],
};

function ClubCard({ club }: { club: typeof PROVIDER_DATA.publishedClubs[0] }) {
  const t = useT();
  const title = useTranslated(club.title);
  const category = useTranslated(club.category);
  const location = useTranslated(club.location);
  const ageRange = useTranslated(club.ageRange);

  return (
    <Link
      to="/class/$id"
      params={{ id: club.id }}
      className="group relative overflow-hidden rounded-3xl border border-border/50 bg-surface transition hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Image & Badges */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={club.image}
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        {club.isNew && (
          <span className="absolute top-3 left-3 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
            NEW
          </span>
        )}
        <span className="absolute top-3 right-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
          {category}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-purple-600">{location}</span>
          <div className="flex items-center gap-1 text-xs font-bold text-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {club.rating}
          </div>
        </div>

        <h3 className="mt-2 text-base font-bold text-foreground transition group-hover:text-purple-600">
          {title}
        </h3>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
          <span className="text-xs font-medium text-muted-foreground">{ageRange}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-foreground">{club.price}₾</span>
            <span className="text-xs text-muted-foreground">/{t("common.monthUnit")}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProviderDetailPage() {
  const navigate = useNavigate();
  const t = useT();
  const rawData = PROVIDER_DATA;

  const name = useTranslated(rawData.name);
  const location = useTranslated(rawData.location);
  const description = useTranslated(rawData.description);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 pb-20 md:px-6">

        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground/70 transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </button>

        {/* HERO SECTION */}
        <div className="mx-auto max-w-5xl">

          {/* Top Banner */}
          <div className="h-40 w-full rounded-t-[2.5rem] bg-gradient-to-r from-purple-100/50 via-emerald-50/50 to-purple-50/50 md:h-52" />

          {/* Main Content Card */}
          <div className="relative -mt-12 rounded-[2.5rem] border border-border/50 bg-background p-6 shadow-sm sm:-mt-16 sm:p-10">

            {/* Header: Avatar, Title, Location & Description */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">

              {/* Logo Box */}
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] bg-purple-50/80 text-3xl font-black text-foreground shadow-sm">
                {rawData.initials}
              </div>

              <div className="space-y-3 pt-1">
                <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                  {name}
                </h1>

                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{location}</span>
                </div>

                <p className="text-sm font-medium text-foreground/80 md:text-base">
                  {description}
                </p>

                {/* Call Action Button */}
                <div className="pt-2">
                  <a
                    href={`tel:${rawData.phone}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-purple-50/80 px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-purple-100"
                  >
                    <Phone className="h-4 w-4 text-foreground/70" />
                    {rawData.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="my-8 h-px w-full bg-border/60" />

            {/* 4 Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* 1. Rating */}
              <div className="rounded-2xl bg-purple-50/50 p-5 transition hover:bg-purple-50">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {t("common.rating")}
                </div>
                <div className="mt-2 text-2xl font-black text-foreground">{rawData.stats.rating}</div>
                <div className="mt-0.5 text-xs font-medium text-muted-foreground">{t("common.noReviews")}</div>
              </div>

              {/* 2. Reviews */}
              <div className="rounded-2xl bg-purple-50/50 p-5 transition hover:bg-purple-50">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  <Star className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("common.reviews")}
                </div>
                <div className="mt-2 text-2xl font-black text-foreground">{rawData.stats.reviewsCount}</div>
              </div>

              {/* 3. Published Clubs */}
              <div className="rounded-2xl bg-purple-50/50 p-5 transition hover:bg-purple-50">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("common.publishedClubs")}
                </div>
                <div className="mt-2 text-2xl font-black text-foreground">{rawData.stats.publishedClubs}</div>
              </div>

              {/* 4. On Activoo */}
              <div className="rounded-2xl bg-purple-50/50 p-5 transition hover:bg-purple-50">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("common.onActivoo")}
                </div>
                <div className="mt-2 text-2xl font-black text-foreground">{rawData.stats.yearsOnActivoo}</div>
              </div>

            </div>
          </div>
        </div>

        {/* Clubs List Section */}
        <div className="mx-auto mt-12 max-w-5xl">

          {/* Header & Filter Dropdown */}
          <div className="flex items-center justify-between pb-6">
            <h2 className="text-xl font-black text-foreground md:text-2xl">
              {t("common.clubs")} ({rawData.publishedClubs.length})
            </h2>

            <div className="relative">
              <button className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-surface px-4 py-2 text-xs font-bold text-foreground shadow-xs transition hover:bg-surface-soft">
                {t("common.mostPopular")}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Clubs Cards Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rawData.publishedClubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>

        </div>

      </div>
    </AppShell>
  );
}