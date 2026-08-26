import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Heart, Share2, Eye, Phone, MessageCircle,
  Check, ChevronRight, Play, Calendar
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClassLocationMap } from "@/components/ClassLocationMap";
import { classImage } from "@/lib/categories";
import { useAuth } from "@/lib/auth-context";
import { useI18n, useT, useTranslated } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/class/$id")({
  component: ClassDetailPage,
});

const GOLDEN_DETAIL_DATA = {
  id: "69cdccd9-0",
  title: "Scratch Coding Adventures",
  category: "IT და კოდინგი",
  isOnline: true,
  views: "1,679",
  date: "18 მარ 26, 11:29",
  city: "თბილისი",
  district: "საბურთალო",
  timeAway: "10 წთ",
  address: "კოსტავას ქ. 45",
  rating: 4.8,
  reviewCount: 96,
  price: 80,
  ageRange: "7-10 წელი",
  durationText: "6 კვ. | 1/კვ 30 მინ.",
  phone: "200 200",
  nextLesson: "27.05, 17:30",
  description: "ისწავლეთ თამაშების და ანიმაციების შექმნა Scratch-ის გამოყენებით. საუკეთესო პირველი ნაბიჯი პროგრამირებაში.",
  school: {
    id: "codekids-tbilisi",
    name: "CodeKids Tbilisi",
    initials: "Co",
    description: "Learn to code while having fun. Scratch, Python and robotics.",
    lat: 41.7151,
    lng: 44.8271,
  },
  highlights: [
    { title: "ინდივიდუალური მიდგომა", subtext: "1 laptop per child" },
    { title: "პრაქტიკული პროექტები", subtext: "Project portfolio" },
    { title: "მშობლების შოუქეისი", subtext: "Parent showcase" },
  ],
  achievements: [
    "1 laptop per child",
    "Project portfolio",
    "Parent showcase",
  ],
  syllabus: [
    { title: "1 გაკვეთილი", desc: "Build games and animations using Scratch. Perfect first step into programming." },
    { title: "2 გაკვეთილი", desc: "Build games and animations using Scratch. Perfect first step into programming." },
  ],
  extraDetails: [
    "Build games and animations using Scratch. Perfect first step into programming.",
    "Build games and animations using Scratch. Perfect first step into programming.",
  ],
  teacher: {
    name: "Person name",
    desc: "Small description about company or person",
    reviews: "Reviews",
    degrees: [
      "Bachelor's Degree in Music or Theatre or Arts",
      "Bachelor's Degree in Music or Theatre or Arts",
    ]
  },
  reviewsList: [
    { name: "Person name", date: "2 დღის უკან", text: "Build games and animations using Scratch. Perfect first step into programming." },
    { name: "Person name", date: "2 დღის უკან", text: "Build games and animations using Scratch. Perfect first step into programming." },
    { name: "Person name", date: "2 დღის უკან", text: "Build games and animations using Scratch. Perfect first step into programming." },
  ],
  scheduleSlots: [
    { day: "ორშაბათს", time: "10:00 AM · 1:00 PM", seats: "20 ადგილი / ჯგუფი" },
    { day: "ორშაბათს", time: "10:00 AM · 1:00 PM", seats: "20 ადგილი" },
    { day: "ორშაბათს", time: "10:00 AM · 1:00 PM", seats: "20 ადგილი" },
    { day: "ორშაბათს", time: "10:00 AM · 1:00 PM", seats: "20 ადგილი" },
    { day: "ორშაბათს", time: "10:00 AM · 1:00 PM", seats: "20 ადგილი" },
  ]
};

// Sub-components for dynamic translations
function HighlightCard({ title, subtext }: { title: string; subtext: string }) {
  const tTitle = useTranslated(title);
  const tSub = useTranslated(subtext);
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-purple-50/60 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-white shadow-sm">
        ★
      </div>
      <div>
        <div className="text-sm font-bold text-foreground">{tTitle}</div>
        <div className="text-xs text-muted-foreground">{tSub}</div>
      </div>
    </div>
  );
}

function AchievementItem({ text }: { text: string }) {
  const tText = useTranslated(text);
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-amber-50/70 px-5 py-4">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white">
        <Check className="h-4 w-4 stroke-[3]" />
      </div>
      <span className="text-sm font-semibold text-foreground/90">{tText}</span>
    </div>
  );
}

function SyllabusItem({ title, desc }: { title: string; desc: string }) {
  const tTitle = useTranslated(title);
  const tDesc = useTranslated(desc);
  return (
    <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-soft">
      <div className="text-base font-bold text-foreground">{tTitle}</div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tDesc}</p>
    </div>
  );
}

function ExtraDetailItem({ text }: { text: string }) {
  const tText = useTranslated(text);
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-purple-50/60 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-white">
        ★
      </div>
      <div className="text-sm font-medium text-foreground/90">
        {tText}
      </div>
    </div>
  );
}

function ReviewItem({ rev }: { rev: { name: string; date: string; text: string } }) {
  const tName = useTranslated(rev.name);
  const tDate = useTranslated(rev.date);
  const tText = useTranslated(rev.text);
  return (
    <div className="rounded-3xl border border-border/60 bg-surface/30 p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-purple-100" />
        <div>
          <div className="text-sm font-bold text-foreground">{tName}</div>
          <div className="text-xs text-muted-foreground">{tDate}</div>
        </div>
      </div>
      <div className="mt-3 flex text-xs text-amber-400">★★★★★</div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/80">{tText}</p>
    </div>
  );
}

function ScheduleSlotItem({ slot }: { slot: { day: string; time: string; seats: string } }) {
  const tDay = useTranslated(slot.day);
  const tTime = useTranslated(slot.time);
  const tSeats = useTranslated(slot.seats);
  return (
    <div className="flex cursor-pointer items-center justify-between rounded-2xl bg-purple-50/50 p-4 transition hover:bg-purple-50">
      <div>
        <div className="font-bold text-foreground text-sm">{tDay}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{tTime}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-foreground">{tSeats}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function TeacherDegreeItem({ text }: { text: string }) {
  const tText = useTranslated(text);
  return <li>{tText}</li>;
}

function ClassDetailPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { lang } = useI18n();
  const t = useT();
  const [isSaved, setIsSaved] = useState(false);
  const rawData = GOLDEN_DETAIL_DATA;

  // Dynamic Content Translations
  const title = useTranslated(rawData.title);
  const category = useTranslated(rawData.category);
  const city = useTranslated(rawData.city);
  const district = useTranslated(rawData.district);
  const timeAway = useTranslated(rawData.timeAway);
  const address = useTranslated(rawData.address);
  const ageRange = useTranslated(rawData.ageRange);
  const durationText = useTranslated(rawData.durationText);
  const nextLesson = useTranslated(rawData.nextLesson);
  const description = useTranslated(rawData.description);

  const schoolName = useTranslated(rawData.school.name);
  const schoolDesc = useTranslated(rawData.school.description);

  const teacherName = useTranslated(rawData.teacher.name);
  const teacherDesc = useTranslated(rawData.teacher.desc);
  const teacherReviews = useTranslated(rawData.teacher.reviews);

  const mainImage = classImage("it", "coding");
  const galleryImages = [mainImage, mainImage, mainImage, mainImage, mainImage];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!user || id.startsWith("test-")) return;
    supabase
      .from("saved_classes")
      .select("id")
      .eq("user_id", user.id)
      .eq("class_id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setIsSaved(true);
      });
  }, [user, id]);

  const toggleSave = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }

    if (id.startsWith("test-")) {
      setIsSaved(!isSaved);
      toast.success(
        !isSaved
          ? (lang === "ka" ? "კლასი წარმატებით შეინახა!" : "Saved successfully!")
          : (lang === "ka" ? "კლასი წაიშალა შენახულებიდან" : "Removed from saved")
      );
      return;
    }

    if (isSaved) {
      const { error } = await supabase
        .from("saved_classes")
        .delete()
        .eq("user_id", user.id)
        .eq("class_id", id);

      if (error) {
        toast.error(error.message);
      } else {
        setIsSaved(false);
        toast.success(lang === "ka" ? "კლასი წაიშალა შენახულებიდან" : "Removed from saved");
      }
    } else {
      const { error } = await supabase
        .from("saved_classes")
        .insert({ user_id: user.id, class_id: id });

      if (error) {
        toast.error(error.message);
      } else {
        setIsSaved(true);
        toast.success(lang === "ka" ? "კლასი წარმატებით შეინახა!" : "Saved successfully!");
      }
    }
  };

  const handleShare = async () => {
    const shareData = {
      title,
      text: description,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(lang === "ka" ? "ბმული დაკოპირდა ბუფერში!" : "Link copied to clipboard!");
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-4 pb-32 md:px-6 md:py-6 lg:pb-12">

        {/* Back Button */}
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground/70 transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </button>

        {/* Gallery Grid Section */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted md:col-span-2 lg:col-span-3 lg:aspect-[21/9]">
            <img src={galleryImages[0]} alt={title} className="h-full w-full object-cover" />
          </div>
          <div className="hidden grid-cols-2 gap-3 md:grid md:grid-cols-1 lg:grid-cols-2 lg:gap-4">
            {galleryImages.slice(1, 5).map((img, idx) => (
              <div key={idx} className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted ${idx > 1 ? 'hidden lg:block' : ''}`}>
                <img src={img} alt="" className="h-full w-full object-cover" />
                {(idx === 1 || idx === 3) && (
                  <div className="absolute bottom-3 right-3 flex items-center justify-center rounded-xl bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                    {t("common.allPhotos")} · 1
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Badges & Meta Info Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {rawData.isOnline && (
              <span className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                ONLINE
              </span>
            )}
            <span className="rounded-md bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
              💻 {category}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {rawData.views}</span>
            <span>{rawData.date}</span>
            <span>ID {rawData.id}</span>
          </div>
        </div>

        {/* Title, Address & Actions */}
        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground md:text-4xl">
              {title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground md:text-sm">
              <span className="font-bold text-foreground">{city}</span>
              <span>📍 {district} · {timeAway}</span>
              <span>{address}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={toggleSave}
              className="flex items-center gap-1.5 rounded-full bg-surface-soft px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-surface hover:text-foreground"
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
              {t("common.save")}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-full bg-surface-soft px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-surface hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
              {t("common.share")}
            </button>
          </div>
        </div>

        {/* MAIN CONTENT & SIDEBAR GRID */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">

          {/* LEFT COLUMN */}
          <div className="space-y-10">

            {/* Provider/School Card */}
            <div className="flex flex-col gap-6 rounded-3xl border border-border/50 bg-surface/50 p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-4">
                <Link
                  to="/provider/$id"
                  params={{ id: rawData.school.id }}
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-700 transition hover:opacity-80"
                >
                  {rawData.school.initials}
                </Link>
                <div>
                  <Link
                    to="/provider/$id"
                    params={{ id: rawData.school.id }}
                    className="group/link inline-block"
                  >
                    <h3 className="text-base font-bold text-foreground transition group-hover/link:text-purple-600 group-hover/link:underline">
                      {schoolName}
                    </h3>
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground sm:max-w-[250px]">{schoolDesc}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 sm:border-l sm:border-border/60 sm:pl-6 text-center">
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t("common.rating")}</div>
                  <div className="text-2xl font-black text-foreground">{rawData.rating}</div>
                  <div className="flex justify-center text-xs text-amber-400">★★★★★</div>
                </div>
                <div className="border-l border-border/60 pl-6">
                  <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t("common.reviews")}</div>
                  <div className="text-2xl font-black text-foreground">{rawData.reviewCount}</div>
                </div>
              </div>
            </div>

            {/* Section: ძირითადი მახასიათებლები */}
            <div>
              <div className="mb-4 h-1.5 w-8 rounded-full bg-amber-400" />
              <h2 className="mb-5 text-xl font-bold text-foreground">{t("common.mainHighlights")}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {rawData.highlights.map((h, i) => (
                  <HighlightCard key={i} title={h.title} subtext={h.subtext} />
                ))}
              </div>

              <div className="mt-8">
                <div className="mb-4 h-1.5 w-8 rounded-full bg-amber-400" />
                <h3 className="mb-3 text-xl font-bold text-foreground">{t("common.description")}</h3>
                <p className="text-sm leading-relaxed text-foreground/80 md:text-base">
                  {description}
                </p>
              </div>
            </div>

            {/* Section: მიღწევები */}
            <div>
              <div className="mb-4 h-1.5 w-8 rounded-full bg-amber-400" />
              <h2 className="mb-5 text-xl font-bold text-foreground">{t("common.achievements")}</h2>
              <div className="space-y-3">
                {rawData.achievements.map((item, idx) => (
                  <AchievementItem key={idx} text={item} />
                ))}
              </div>
            </div>

            {/* Section: Location on map */}
            <div>
              <div className="mb-4 h-1.5 w-8 rounded-full bg-amber-400" />
              <h2 className="mb-5 text-xl font-bold text-foreground">{t("common.locationOnMap")}</h2>
              <div className="overflow-hidden rounded-3xl shadow-sm border border-border/50">
                <div className="h-56 w-full">
                  <ClassLocationMap
                    location={{
                      providerId: rawData.school.id, // <-- გადაეცემა პროვაიდერის ID, რომ რუკის პოპაპზე სათაური გახდეს ლინკი!
                      lat: rawData.school.lat,
                      lng: rawData.school.lng,
                      title: schoolName,
                      address: address,
                    }}
                  />
                </div>
                <div className="bg-purple-50/60 p-5">
                  <Link
                    to="/provider/$id"
                    params={{ id: rawData.school.id }}
                    className="text-base font-bold text-foreground transition hover:text-purple-600 hover:underline inline-block"
                  >
                    {schoolName}
                  </Link>
                  <div className="mt-1 text-sm text-muted-foreground">{address}</div>
                </div>
              </div>
            </div>

            {/* Section: სილაბუსი */}
            <div>
              <div className="mb-4 h-1.5 w-8 rounded-full bg-amber-400" />
              <h2 className="mb-5 text-xl font-bold text-foreground">{t("common.syllabus")}</h2>
              <div className="space-y-4">
                {rawData.syllabus.map((s, i) => (
                  <SyllabusItem key={i} title={s.title} desc={s.desc} />
                ))}
              </div>
            </div>

            {/* Section: დამატებითი დეტალები */}
            <div>
              <div className="mb-4 h-1.5 w-8 rounded-full bg-amber-400" />
              <h2 className="mb-5 text-xl font-bold text-foreground">{t("common.details")}</h2>
              <div className="space-y-3">
                {rawData.extraDetails.map((item, i) => (
                  <ExtraDetailItem key={i} text={item} />
                ))}
              </div>
            </div>

            {/* Section: მასწავლებლები */}
            <div>
              <div className="mb-4 h-1.5 w-8 rounded-full bg-amber-400" />
              <h2 className="mb-5 text-xl font-bold text-foreground">{t("common.teachers")}</h2>
              <div className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-surface p-6 shadow-soft md:flex-row md:items-center md:justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100" />
                    <div>
                      <div className="text-base font-bold text-foreground">{teacherName}</div>
                      <div className="text-sm text-muted-foreground">{teacherDesc}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground/70 mb-1">{teacherReviews}</div>
                    <ul className="list-inside list-disc text-sm text-muted-foreground space-y-1">
                      {rawData.teacher.degrees.map((deg, i) => (
                        <TeacherDegreeItem key={i} text={deg} />
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex h-36 w-full shrink-0 items-center justify-center rounded-2xl bg-purple-100/80 md:w-56">
                  <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-105">
                    <Play className="ml-1 h-5 w-5 fill-foreground text-foreground" />
                  </button>
                </div>
              </div>
            </div>

            {/* Section: შეფასება */}
            <div>
              <div className="mb-4 h-1.5 w-8 rounded-full bg-amber-400" />
              <h2 className="mb-5 text-xl font-bold text-foreground">{t("common.reviews")}</h2>

              <div className="mb-8 flex items-center justify-center gap-4 text-3xl font-black text-foreground">
                <span className="text-4xl">🏆</span>
                <span>4.80</span>
                <span className="text-4xl">🏆</span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {rawData.reviewsList.map((rev, i) => (
                  <ReviewItem key={i} rev={rev} />
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8 lg:sticky lg:top-6 lg:h-fit">

            <div className="rounded-[2rem] border border-border/60 bg-surface p-6 shadow-elevated lg:p-8">
              <h3 className="text-xl font-bold text-foreground">{t("common.groupCourse")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("common.standardFormat")}</p>

              {/* Age & Duration Box */}
              <div className="mt-6 flex items-center justify-between rounded-3xl bg-purple-50/70 p-4">
                <div>
                  <span className="block text-lg font-black text-foreground">{ageRange}</span>
                  <span className="text-xs font-medium text-muted-foreground">{t("common.age")}</span>
                </div>
                <div className="h-10 w-px bg-purple-200/50" />
                <div className="text-right">
                  <span className="block text-sm font-bold text-foreground">{durationText}</span>
                  <span className="text-xs font-medium text-muted-foreground">{t("common.duration")}</span>
                </div>
              </div>

              {/* Price */}
              <div className="mt-8 flex items-end gap-1.5">
                <span className="text-5xl font-black leading-none text-foreground">{rawData.price}</span>
                <span className="mb-1 text-2xl font-bold text-foreground">₾</span>
                <span className="mb-1.5 text-sm text-muted-foreground">/ {t("common.monthUnit")}</span>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center gap-2">
                <button className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-400 text-sm font-bold text-white shadow-soft transition hover:bg-purple-500">
                  <Phone className="h-5 w-5" />
                  {rawData.phone}
                </button>
                <button className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-foreground transition hover:bg-purple-100">
                  f
                </button>
                <button className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-foreground transition hover:bg-purple-100">
                  📸
                </button>
                <button className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-soft transition hover:bg-emerald-600">
                  <MessageCircle className="h-6 w-6" />
                </button>
              </div>

              <button className="mt-3 w-full rounded-2xl border-2 border-border py-3.5 text-sm font-bold text-foreground transition hover:bg-surface-soft">
                {t("common.askQuestion")}
              </button>

              <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{t("common.nextLesson")}</span>
                </div>
                <span className="font-bold text-foreground">{nextLesson}</span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="mb-4 text-base font-bold text-foreground">{t("common.tags")}</h4>
              <div className="flex flex-wrap gap-2">
                {[category, city, district].filter(Boolean).map((tag, i) => (
                  <span key={i} className="rounded-xl bg-purple-50 px-4 py-2 text-xs font-semibold text-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Calendar Slots */}
            <div>
              <h4 className="mb-4 text-base font-bold text-foreground">{t("common.schedule")}</h4>
              <div className="space-y-2">
                {rawData.scheduleSlots.map((slot, i) => (
                  <ScheduleSlotItem key={i} slot={slot} />
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}