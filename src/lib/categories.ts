import danceImg from "@/assets/class-dance.jpg";
import codingImg from "@/assets/class-coding.jpg";
import soccerImg from "@/assets/class-soccer.jpg";
import artImg from "@/assets/class-art.jpg";
import languageImg from "@/assets/class-language.jpg";
import chessImg from "@/assets/class-chess.jpg";
import { supabase } from "@/integrations/supabase/client"; // Supabase-ის დაიმპორტება URL-ის დასაგენერირებლად

export type CategoryKey = "creativity" | "it" | "sports" | "development" | "languages";

export const CATEGORIES: Record<
  CategoryKey,
  { label: string; labelKey: string; emoji: string; image: string; tint: string }
> = {
  creativity: { label: "შემოქმედება", labelKey: "cat.art", emoji: "🎨", image: artImg, tint: "from-pink-200/60 to-fuchsia-200/40" },
  it:         { label: "IT და კოდინგი", labelKey: "cat.it", emoji: "💻", image: codingImg, tint: "from-blue-200/60 to-indigo-200/40" },
  sports:     { label: "სპორტი", labelKey: "cat.sports", emoji: "⚽", image: soccerImg, tint: "from-amber-200/60 to-orange-200/40" },
  development:{ label: "განვითარება", labelKey: "cat.early", emoji: "🧠", image: chessImg, tint: "from-emerald-200/60 to-teal-200/40" },
  languages:  { label: "ენები", labelKey: "cat.languages", emoji: "🌍", image: languageImg, tint: "from-violet-200/60 to-purple-200/40" },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

/**
 * Resolve image for a class. Prefers explicit image_url, falls back to a
 * curated category image so the UI is never empty.
 */
export function classImage(category: CategoryKey, imageUrl?: string | null): string {
  // 1. თუ image_url საერთოდ არ გვაქვს, პირდაპირ ვაბრუნებთ კატეგორიის სურათს
  if (!imageUrl) {
    return CATEGORIES[category]?.image || artImg; // უსაფრთხო fallback თუ category არასწორია
  }

  // 2. თუ სრული URL-ია (http/https), Data URI-ა, ან ლოკალური absolute path-ია
  if (/^(https?:|data:|\/)/.test(imageUrl)) {
    return imageUrl;
  }

  // 3. Seed data - ლოკალური ფაილების ამოცნობა სახელებით (case-insensitive)
  const lowerUrl = imageUrl.toLowerCase();
  if (lowerUrl.includes("dance")) return danceImg;
  if (lowerUrl.includes("coding")) return codingImg;
  if (lowerUrl.includes("soccer")) return soccerImg;
  if (lowerUrl.includes("art")) return artImg;
  if (lowerUrl.includes("language")) return languageImg;
  if (lowerUrl.includes("chess")) return chessImg;

  // 4. თუ Supabase-ის მხოლოდ path არის შენახული ბაზაში (მაგ: "uploads/file.jpg")
  // ავტომატურად ვაგენერირებთ სრულ Public URL-ს public-images ბაქეტიდან
  if (imageUrl.includes("/") || imageUrl.includes(".")) {
    const { data } = supabase.storage.from("public-images").getPublicUrl(imageUrl);
    if (data?.publicUrl) return data.publicUrl;
  }

  // 5. საბოლოო სათადარიგო სურათი კატეგორიის მიხედვით
  return CATEGORIES[category]?.image || artImg;
}

export const DISTRICTS = ["Vake", "Saburtalo", "Vera", "Didi Dighomi", "Old Tbilisi", "Isani"] as const;

export const AGE_BUCKETS = [
  { label: "3–5", min: 3, max: 5 },
  { label: "6–9", min: 6, max: 9 },
  { label: "10–14", min: 10, max: 14 },
] as const;

export const PRICE_BUCKETS = [
  { label: "Under 50 ₾", min: 0, max: 49 },
  { label: "50–100 ₾", min: 50, max: 100 },
  { label: "100+ ₾", min: 100, max: 99999 },
] as const;