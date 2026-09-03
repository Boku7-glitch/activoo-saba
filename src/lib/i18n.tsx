import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translateBatch } from "@/lib/translate.functions";
import { supabase } from "@/integrations/supabase/client";

export type Lang = "ka" | "en";

const STORAGE_KEY = "activoo:lang";

// ============= UI dictionaries =============
// Source: Georgian (ka). English is the translated version.
// Use t("key") in components.
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
  "common.terms": { ka: "წესები და პირობები", en: "T&C" },
  "common.privacy": { ka: "კონფიდენციალურობა", en: "Privacy" },
  "common.back": { ka: "უკან", en: "Back" },
  "common.save": { ka: "შენახვა", en: "Save" },
  "common.share": { ka: "გაზიარება", en: "Share" },
  "common.viewOnMap": { ka: "რუკაზე ნახვა", en: "View on map" },
  "common.allPhotos": { ka: "ყველა ფოტო", en: "All photos" },
  "common.all": { ka: "ყველა", en: "All" },
  "common.age": { ka: "ასაკი", en: "Age" },
  "common.price": { ka: "ფასი", en: "Price" },
  "common.location": { ka: "ლოკაცია", en: "Location" },
  "common.reviews": { ka: "მიმოხილვები", en: "Reviews" },
  "common.rating": { ka: "რეიტინგი", en: "Rating" },
  "common.from": { ka: "დან", en: "from" },
  "common.perMonth": { ka: "/ თვ.", en: "/ mo." },
  "common.years": { ka: "წელი", en: "years" },
  "common.yearsShort": { ka: "წ", en: "y" },
  "common.verified": { ka: "ვერიფიცირებული", en: "Verified" },
  "common.new": { ka: "ახალი", en: "New" },
  "common.freeTrial": { ka: "უფასო საცდელი", en: "Free trial" },
  "common.group": { ka: "ჯგუფური", en: "Group" },
  "common.individual": { ka: "ინდივიდუალური", en: "Individual" },
  "common.sendRequest": { ka: "განაცხადის გაგზავნა", en: "Send request" },
  "common.sending": { ka: "იგზავნება...", en: "Sending..." },
  "common.requestSent": { ka: "განაცხადი გაგზავნილია!", en: "Request sent!" },
  "common.browseMore": { ka: "სხვა წრეების დათვალიერება", en: "Browse more classes" },
  "common.backHome": { ka: "მთავარ გვერდზე დაბრუნება", en: "Back to home" },
  "common.linkCopied": { ka: "ბმული დაკოპირდა", en: "Link copied" },

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
  "cat.it": { ka: "IT და კოდინგი", en: "IT & Coding" },
  "cat.art": { ka: "ხელოვნება და ხატვა", en: "Art & Painting" },
  "cat.music": { ka: "მუსიკა", en: "Music" },
  "cat.languages": { ka: "უცხო ენები", en: "Languages" },
  "cat.science": { ka: "მეცნიერება", en: "Science" },
  "cat.early": { ka: "ადრეული განვითარება", en: "Early development" },
  "cat.creativity": { ka: "შემოქმედება და ხელსაქმე", en: "Creativity & Crafts" },
  "cat.cooking": { ka: "კულინარია", en: "Culinary" },
  "cat.pottery": { ka: "კერამიკა და თიხა", en: "Ceramics & Pottery" },
  "cat.tutoring": { ka: "რეპეტიტორები", en: "Tutoring" },
  "cat.speech": { ka: "ლოგოპედი და ფსიქოლოგი", en: "Speech & Psychology" },

  // Class Detail Page
  "class.highlights": { ka: "მთავარი", en: "Highlights" },
  "class.description": { ka: "აღწერილობა", en: "Description" },
  "class.schedule": { ka: "განრიგი და ჯგუფები", en: "Schedule & groups" },
  "class.benefits": { ka: "მიღწევები და მიზნები", en: "Benefits & Goals" },
  "class.syllabus": { ka: "სილაბუსი", en: "Syllabus" },
  "class.extraDetails": { ka: "დამატებითი დეტალები", en: "Additional Details" },
  "class.teachers": { ka: "მასწავლებლები", en: "Instructors & Teachers" },
  "class.mapLocation": { ka: "ლოკაცია რუკაზე", en: "Location on map" },
  "class.classType": { ka: "კლასის ტიპი", en: "Class type" },
  "class.groupClass": { ka: "ჯგუფური კლასი", en: "Group class" },
  "class.individualClass": { ka: "ინდივიდუალური", en: "Individual" },
  "class.period": { ka: "პერიოდი", en: "Lessons" },
  "class.perWeek": { ka: "/კვ", en: "/week" },
  "class.min": { ka: "წთ", en: "min" },
  "class.language": { ka: "ენა", en: "Language" },
  "class.askQuestion": { ka: "კითხვის დასმა", en: "Ask a question" },
  "class.freeTrialAvailable": { ka: "უფასო საცდელი ხელმისაწვდომია", en: "Free trial available" },
  "class.tags": { ka: "თეგები", en: "Tags" },
  "class.calendar": { ka: "კალენდარი", en: "Calendar" },
  "class.groupCol": { ka: "ჯგუფი", en: "Group" },
  "class.dayCol": { ka: "დღე", en: "Day" },
  "class.timeCol": { ka: "დრო", en: "Time" },
  "class.seatsCol": { ka: "ადგილები", en: "Seats" },
  "class.freeCol": { ka: "თავისუფალი", en: "Free" },
  "class.lesson": { ka: "გაკვეთილი", en: "Lesson" },
  "class.seats": { ka: "ადგილი", en: "seats" },
  "class.free": { ka: "თავისუფალი", en: "free" },

  // School Profile Page
  "school.rating": { ka: "რეიტინგი", en: "Rating" },
  "school.reviews": { ka: "მიმოხილვები", en: "Reviews" },
  "school.publishedClubs": { ka: "აქტიური კლუბები", en: "Published clubs" },
  "school.onActivoo": { ka: "activoo-ზე", en: "On activoo" },
  "school.clubs": { ka: "კლუბები და წრეები", en: "Clubs & Classes" },
  "school.mostPopular": { ka: "პოპულარული", en: "Most popular" },
  "school.highestRated": { ka: "მაღალი რეიტინგით", en: "Highest rated" },
  "school.newest": { ka: "უახლესი", en: "Newest" },
  "school.alphabetical": { ka: "ანბანით", en: "Alphabetically" },
  "school.noClubs": { ka: "გამოქვეყნებული წრეები ჯერ არ არის.", en: "No published clubs yet." },
  "school.noReviews": { ka: "შეფასებები არ არის", en: "No reviews yet" },
  "school.rated": { ka: "შეფასება", en: "rated" },

  // Search Page
  "search.searching": { ka: "იძებნება...", en: "Searching..." },
  "search.noResults": { ka: "შედეგები ვერ მოიძებნა", en: "No results found" },
  "search.tryAnother": { ka: "სცადეთ სხვა საძიებო სიტყვა.", en: "Try another keyword." },
  "search.schools": { ka: "სკოლები", en: "Schools" },
  "search.list": { ka: "სია", en: "List" },
  "search.map": { ka: "რუკა", en: "Map" },
  "search.all": { ka: "ყველა", en: "All" },
  "search.anyAge": { ka: "ნებისმიერი ასაკი", en: "Any age" },
  "search.anyPrice": { ka: "ნებისმიერი ფასი", en: "Any price" },
  "search.allLocations": { ka: "ყველა ლოკაცია", en: "All locations" },
  "search.classesFound": { ka: "წრე", en: "classes" },
  "search.results": { ka: "შედეგი", en: "results" },

  // Booking Page
  "book.sendRequest": { ka: "განაცხადის გაგზავნა", en: "Send request" },
  "book.yourName": { ka: "თქვენი სახელი", en: "Your name" },
  "book.phone": { ka: "ტელეფონის ნომერი", en: "Phone" },
  "book.childAge": { ka: "ბავშვის ასაკი", en: "Child's age" },
  "book.message": { ka: "შეტყობინება (სურვილისამებრ)", en: "Message (optional)" },
  "book.messagePlaceholder": { ka: "რაიმე დამატებითი ინფორმაცია სკოლისთვის?", en: "Anything the school should know?" },
  "book.signInRequired": { ka: "საჭიროა ავტორიზაცია", en: "Sign in required" },
  "book.signInPrompt": { ka: "განაცხადის გასაგზავნად გთხოვთ გაიაროთ ავტორიზაცია.", en: "Please sign in to send a request to the school." },
  "book.disclaimer": { ka: "განაცხადის გაგზავნით თქვენ ეთანხმებით, რომ სკოლა დაგიკავშირდებათ ამ წრესთან დაკავშირებით.", en: "By sending, you agree the school may contact you about this class." },
  "book.successTitle": { ka: "განაცხადი გაგზავნილია!", en: "Request sent!" },
  "book.successDesc": { ka: "სკოლა მალე დაგიკავშირდებათ. შეამოწმეთ თქვენი ტელეფონი შეტყობინებებისთვის.", en: "The school will contact you shortly. Check your phone for messages." },

  // Auth Page
  "auth.welcomeBack": { ka: "მოგესალმებით", en: "Welcome back" },
  "auth.join": { ka: "შემოუერთდით activoo-ს", en: "Join activoo" },
  "auth.signInSubtitle": { ka: "შედით ანგარიშში წრეების შესანახად და განაცხადების სამართავად.", en: "Sign in to save classes and track requests." },
  "auth.signUpSubtitle": { ka: "აირჩიეთ როგორ გსურთ activoo-ს გამოყენება.", en: "Choose how you want to use activoo." },
  "auth.parentRole": { ka: "ვეძებ წრეებს", en: "I'm looking for classes" },
  "auth.schoolRole": { ka: "მაქვს სკოლა / სტუდია", en: "I run a school" },
  "auth.fullName": { ka: "სახელი და გვარი", en: "Full name" },
  "auth.email": { ka: "ელფოსტა", en: "Email" },
  "auth.password": { ka: "პაროლი", en: "Password" },
  "auth.passwordSignupHint": { ka: "მინიმუმ 8 სიმბოლო", en: "At least 8 characters" },
  "auth.passwordSigninHint": { ka: "თქვენი პაროლი", en: "Your password" },
  "auth.forgotPassword": { ka: "დაგავიწყდათ პაროლი?", en: "Forgot password?" },
  "auth.agree": { ka: "ვეთანხმები", en: "I agree to the" },
  "auth.and": { ka: "და", en: "and" },
  "auth.terms": { ka: "წესებსა და პირობებს", en: "Terms & Conditions" },
  "auth.privacy": { ka: "კონფიდენციალურობის პოლიტიკას", en: "Privacy Policy" },
  "auth.createAccount": { ka: "ანგარიშის შექმნა", en: "Create account" },
  "auth.newHere": { ka: "ახალი ხართ?", en: "New here?" },
  "auth.alreadyHave": { ka: "უკვე გაქვთ ანგარიში?", en: "Already have an account?" },
  "auth.confirmEmail": { ka: "დაადასტურეთ ელფოსტა", en: "Confirm your email" },
  "auth.resendEmail": { ka: "დადასტურების ბმულის ხელახლა გაგზავნა", en: "Resend confirmation email" },
  "auth.backToSignIn": { ka: "შესვლაზე დაბრუნება", en: "Back to sign in" },
  "auth.resetPassword": { ka: "პაროლის აღდგენა", en: "Reset password" },
  "auth.sendResetLink": { ka: "აღდგენის ბმულის გაგზავნა", en: "Send reset link" },
  "auth.checkInbox": { ka: "შეამოწმეთ ელფოსტა", en: "Check your inbox" },

  // Profile Page
  "profile.savedClasses": { ka: "შენახული წრეები", en: "Saved classes" },
  "profile.viewedHistory": { ka: "ნანახი წრეები", en: "Viewed history" },
  "profile.notifications": { ka: "შეტყობინებები", en: "Notifications" },
  "profile.welcome": { ka: "მოგესალმებით", en: "Welcome" },

  // Smart Match
  "match.smartMatch": { ka: "სმარტ შერჩევა", en: "Smart Match" },
  "match.noMatches": { ka: "ზუსტი დამთხვევა ვერ მოიძებნა. სცადეთ ფილტრების გაფართოება.", en: "No exact matches. Try widening your filters." },
  "match.browseAll": { ka: "ყველა წრის დათვალიერება", en: "Browse all classes" },
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
  // English browser -> en, otherwise default Georgian
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
    if (!entry) return key;
    return entry[lang] ?? entry.ka ?? key;
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

// ============= Dynamic content translation (DB content) =============
// Translates Georgian DB content to the active language (English) using the
// server function (which uses Lovable AI + DB cache). Returns the source
// text immediately, then swaps in the translation when ready.
const memCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
const LS_PREFIX = "activoo:tr:";

function lsGet(key: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(LS_PREFIX + key) ?? undefined;
}
function lsSet(key: string, val: string) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LS_PREFIX + key, val); } catch { /* quota */ }
}

/** Translate a single string. If lang is 'ka' (source), returns text as-is. */
export function useTranslated(text: string | null | undefined): string {
  const { lang } = useI18n();
  const source = text ?? "";
  const trimmed = source.trim();
  const cacheKey = `${lang}:${trimmed}`;
  const initial = lang === "ka" || !trimmed
    ? source
    : (memCache.get(cacheKey) ?? lsGet(cacheKey) ?? source);
  const [out, setOut] = useState<string>(initial);

  useEffect(() => {
    if (lang === "ka" || !trimmed) { setOut(source); return; }
    const cached = memCache.get(cacheKey) ?? lsGet(cacheKey);
    if (cached) { setOut(cached); memCache.set(cacheKey, cached); return; }
    setOut(source); // show source while loading
    let cancelled = false;
    let p = inflight.get(cacheKey);
    if (!p) {
      p = translateBatch({ data: { texts: [trimmed], target: lang } })
        .then((res) => {
          const v = res?.translations?.[0] ?? trimmed;
          memCache.set(cacheKey, v);
          lsSet(cacheKey, v);
          inflight.delete(cacheKey);
          return v;
        })
        .catch(() => { inflight.delete(cacheKey); return trimmed; });
      inflight.set(cacheKey, p);
    }
    p.then((v) => { if (!cancelled) setOut(v); });
    return () => { cancelled = true; };
  }, [cacheKey, lang, source, trimmed]);

  return out;
}

/**
 * Prefer an admin-provided English value when the active language is English
 * and the value is non-empty. Otherwise fall back to the Georgian source.
 * Use this for DB rows that have sibling `_en` columns.
 */
export function useLocalized(ka: string | null | undefined, en: string | null | undefined): string {
  const { lang } = useI18n();
  const kaVal = (ka ?? "").toString();
  const enVal = (en ?? "").toString().trim();
  if (lang === "en" && enVal) return enVal;
  return kaVal;
}

// ============= Nav items (header/footer/social), admin-editable =============
export interface NavItem {
  id: string;
  location: "header" | "footer" | "social";
  group_ka: string | null;
  group_en: string | null;
  label_ka: string;
  label_en: string | null;
  href: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
}

export function useNavItems(location: NavItem["location"]): NavItem[] {
  const [items, setItems] = useState<NavItem[]>([]);
  useEffect(() => {
    supabase
      .from("nav_items")
      .select("*")
      .eq("location", location)
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setItems((data as NavItem[] | null) ?? []));
  }, [location]);
  return items;
}
