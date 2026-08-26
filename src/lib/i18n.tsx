import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translateBatch } from "@/lib/translate.functions";

export type Lang = "ka" | "en";

const STORAGE_KEY = "activoo:lang";

// ============= UI dictionaries =============
const DICT: Record<string, { ka: string; en: string }> = {
  // Generic / Common
  "common.signIn": { ka: "შესვლა", en: "Sign in" },
  "common.signOut": { ka: "გასვლა", en: "Sign out" },
  "common.account": { ka: "ანგარიში", en: "Account" },
  "common.profile": { ka: "პროფილი", en: "Profile" },
  "common.saved": { ka: "შენახული", en: "Saved" },
  "common.search": { ka: "ძიება", en: "Search" },
  "common.dashboard": { ka: "მართვის პანელი", en: "Dashboard" },
  "common.change": { ka: "შეცვლა", en: "Change" },
  "common.seeAll": { ka: "ყველას ნახვა", en: "See all" },
  "common.home": { ka: "მთავარი", en: "Home" },
  "common.smartMatch": { ka: "სმარტ შერჩევა", en: "Smart Match" },
  "common.forSchools": { ka: "სკოლებისთვის", en: "For schools" },
  "common.loading": { ka: "იტვირთება...", en: "Loading..." },
  "common.back": { ka: "უკან", en: "Back" },
  "common.save": { ka: "შენახვა", en: "Save" },
  "common.share": { ka: "გაზიარება", en: "Share" },
  "common.rating": { ka: "რეიტინგი", en: "Rating" },
  "common.reviews": { ka: "შეფასებები", en: "Reviews" },
  "common.allPhotos": { ka: "ყველა ფოტო", en: "All photos" },
  "common.locationOnMap": { ka: "მდებარეობა რუკაზე", en: "Location on map" },
  "common.description": { ka: "აღწერა", en: "Description" },
  "common.syllabus": { ka: "სასწავლო პროგრამა", en: "Syllabus" },
  "common.details": { ka: "დეტალები", en: "Details" },
  "common.teachers": { ka: "ინსტრუქტორები / მასწავლებლები", en: "Instructors / Teachers" },
  "common.schedule": { ka: "განრიგი", en: "Schedule" },
  "common.tags": { ka: "ტეგები", en: "Tags" },
  "common.askQuestion": { ka: "კითხვის დასმა", en: "Ask question" },
  "common.nextLesson": { ka: "შემდეგი გაკვეთილი", en: "Next lesson" },
  "common.mainHighlights": { ka: "მთავარი უპირატესობები", en: "Main highlights" },
  "common.achievements": { ka: "მიღწევები & ბენეფიტები", en: "Achievements & benefits" },
  "common.submit": { ka: "გაგზავნა", en: "Submit" },
  "common.cancel": { ka: "გაუქმება", en: "Cancel" },
  "common.close": { ka: "დახურვა", en: "Close" },

  // Home
  "home.heroTitle": { ka: "იპოვე შენი ბავშვისთვის სრულყოფილი წრე 1 წუთში", en: "Find the perfect class for your child in 1 minute" },
  "home.heroSubtitle": { ka: "ცეკვა, IT, სპორტი, ენები და სხვა — შენ ახლოს, მშობლების მიერ მოწონებული.", en: "Dance, IT, sports, languages and more — near you, trusted by parents." },
  "home.searchPlaceholder": { ka: "მოძებნე წრე ან სკოლა", en: "Search for a class or school" },
  "home.smartMatchCTA": { ka: "სმარტ შერჩევა — იპოვე წრე 60 წამში", en: "Smart Match — find a class in 60 seconds" },
  "home.browseCategories": { ka: "კატეგორიების დათვალიერება", en: "Browse categories" },
  "home.popular": { ka: "პოპულარული წრეები", en: "Popular classes" },
  "home.popularSubtitle": { ka: "მშობლების ფავორიტი ამ კვირაში", en: "Loved by parents this week" },
  "home.new": { ka: "ახალი activoo-ზე", en: "New on activoo" },
  "home.newSubtitle": { ka: "ახლადდამატებული წრეები", en: "Fresh classes just added" },
  "home.nearby": { ka: "ახლოს", en: "Nearby" },
  "home.nearbyAround": { ka: "ახლოს", en: "Around" },
  "home.empty": { ka: "ჯერ წრეები არ არის.", en: "No classes yet." },
  "home.statsClasses": { ka: "სანდო წრეები", en: "Trusted classes" },
  "home.statsParents": { ka: "ბედნიერი მშობლები", en: "Happy parents" },
  "home.statsRating": { ka: "საშუალო შეფასება", en: "Avg. rating" },
  "home.forSchoolsTag": { ka: "სკოლებისთვის", en: "For schools" },
  "home.forSchoolsTitle": { ka: "მიაღწიე მეტ მშობელს თბილისში", en: "Reach more parents in Tbilisi" },
  "home.forSchoolsSubtitle": { ka: "დაამატე შენი წრეები უფასოდ და მიიღე განაცხადები დღესვე.", en: "List your classes for free and start receiving leads today." },
  "home.becomePartner": { ka: "გახდი პარტნიორი →", en: "Become a partner →" },
  "home.locationPrompt": { ka: "შეიყვანე შენი უბანი ან ქალაქი", en: "Enter your area or city" },

  // Categories
  "cat.dance": { ka: "ცეკვა", en: "Dance" },
  "cat.sports": { ka: "სპორტი", en: "Sports" },
  "cat.it": { ka: "IT", en: "IT" },
  "cat.art": { ka: "ხელოვნება", en: "Art" },
  "cat.music": { ka: "მუსიკა", en: "Music" },
  "cat.languages": { ka: "ენები", en: "Languages" },
  "cat.science": { ka: "მეცნიერება", en: "Science" },
  "cat.early": { ka: "ადრეული განვითარება", en: "Early development" },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "ka";
  const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved === "ka" || saved === "en") return saved;
  const nav = window.navigator?.language?.toLowerCase() ?? "";
  if (nav.startsWith("en")) return "en";
  return "ka";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ka");

  useEffect(() => {
    const initial = detectInitialLang();
    setLangState(initial);
    if (typeof document !== "undefined") document.documentElement.lang = initial;
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    }
  }, []);

  const t = useCallback((key: string) => {
    const entry = DICT[key];
    if (entry) {
      return entry[lang] ?? entry.ka ?? key;
    }

    // Smart Fallback: თუ კეი DICT-ში საერთოდ არ წერია (მაგ: "common.someNewKey"),
    // "common.someNewKey"-ს ნაცვლად ლამაზად გამოიტანს "Some New Key"-ს
    if (key.includes(".")) {
      const rawKey = key.split(".").pop() || key;
      return rawKey
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    }

    return key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}

// ============= Dynamic content translation (DB content with Batching) =============
const memCache = new Map<string, string>();
const LS_PREFIX = "activoo:tr:";

function lsGet(key: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(LS_PREFIX + key) ?? undefined;
}
function lsSet(key: string, val: string) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LS_PREFIX + key, val); } catch { /* quota */ }
}

const pendingQueues = new Map<Lang, Set<string>>();
const listenersMap = new Map<Lang, Set<() => void>>();
let batchTimer: NodeJS.Timeout | null = null;

function processBatch(targetLang: Lang) {
  const textsSet = pendingQueues.get(targetLang);
  if (!textsSet || textsSet.size === 0) return;

  const textsToTranslate = Array.from(textsSet);
  pendingQueues.set(targetLang, new Set());

  for (let i = 0; i < textsToTranslate.length; i += 50) {
    const chunk = textsToTranslate.slice(i, i + 50);
    translateBatch({ data: { texts: chunk, target: targetLang } })
      .then((res) => {
        const translations = res?.translations ?? [];
        chunk.forEach((txt, idx) => {
          const translated = translations[idx] ?? txt;
          const cacheKey = `${targetLang}:${txt}`;
          memCache.set(cacheKey, translated);
          lsSet(cacheKey, translated);
        });
        listenersMap.get(targetLang)?.forEach((cb) => cb());
      })
      .catch((err) => {
        console.error("Batch translation failed:", err);
      });
  }
}

function queueTextForTranslation(lang: Lang, text: string) {
  if (!pendingQueues.has(lang)) {
    pendingQueues.set(lang, new Set());
  }
  pendingQueues.get(lang)!.add(text);

  if (batchTimer) clearTimeout(batchTimer);
  batchTimer = setTimeout(() => {
    for (const l of pendingQueues.keys()) {
      processBatch(l);
    }
  }, 60);
}

/** Translate a single string with automatic batching and instant cache response. */
export function useTranslated(text: string | null | undefined): string {
  const { lang } = useI18n();
  const source = text ?? "";
  const trimmed = source.trim();
  const cacheKey = `${lang}:${trimmed}`;

  const cached = lang === "ka" || !trimmed
    ? source
    : (memCache.get(cacheKey) ?? lsGet(cacheKey));

  const [out, setOut] = useState<string>(cached ?? source);

  useEffect(() => {
    if (lang === "ka" || !trimmed) {
      setOut(source);
      return;
    }

    const cachedVal = memCache.get(cacheKey) ?? lsGet(cacheKey);
    if (cachedVal) {
      setOut(cachedVal);
      memCache.set(cacheKey, cachedVal);
      return;
    }

    setOut(source);

    if (!listenersMap.has(lang)) {
      listenersMap.set(lang, new Set());
    }

    const updateListener = () => {
      const updated = memCache.get(cacheKey) ?? lsGet(cacheKey);
      if (updated) setOut(updated);
    };

    listenersMap.get(lang)!.add(updateListener);
    queueTextForTranslation(lang, trimmed);

    return () => {
      listenersMap.get(lang)?.delete(updateListener);
    };
  }, [cacheKey, lang, source, trimmed]);

  return cached ?? out;
}