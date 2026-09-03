import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Intelligent mapping from CMS icon keywords, Lucide names, or categories to matching emojis.
 */
const EMOJI_MAP: Record<string, string> = {
  // Art & Painting
  palette: "🎨",
  art: "🎨",
  paint: "🎨",
  painting: "🎨",

  // Creativity & Handmade Crafts
  creativity: "✂️",
  craft: "✂️",
  crafts: "✂️",
  handmade: "✂️",
  theater: "🎭",

  // IT & Tech & Coding
  laptop: "💻",
  it: "💻",
  coding: "💻",
  tech: "💻",
  code: "💻",
  robotics: "🤖",
  robot: "🤖",

  // Sports & Fitness
  trophy: "⚽",
  sports: "⚽",
  sport: "⚽",
  fitness: "🏋️",
  football: "⚽",
  soccer: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  swimming: "🏊",
  martialarts: "🥋",
  karate: "🥋",
  judo: "🥋",
  boxing: "🥊",
  gymnastics: "🤸",

  // Music & Vocal
  music: "🎵",
  vocal: "🎤",
  guitar: "🎸",
  piano: "🎹",
  singing: "🎤",

  // Dance & Choreography
  dance: "💃",
  sparkles: "✨",
  choreography: "🩰",
  ballet: "🩰",

  // Cooking & Culinary
  chefhat: "🍳",
  cooking: "🍳",
  culinary: "🧁",
  pastry: "🍰",
  baking: "🧁",
  food: "🍕",

  // Pottery & Ceramics (კერამიკა და თიხა)
  shapes: "🏺",
  pottery: "🏺",
  ceramics: "🏺",
  clay: "🏺",
  sculpture: "🗿",

  // Tutoring, School & Languages
  bookopen: "📚",
  book: "📚",
  school: "📚",
  tutoring: "📚",
  graduationcap: "🎓",
  examprep: "📝",
  languages: "🌍",
  globe: "🌍",
  english: "🇬🇧",

  // Speech Therapy & Psychology (ლოგოპედი და ფსიქოლოგი)
  smile: "🗣️",
  speech: "🗣️",
  psychology: "🧠",
  brain: "🧠",
  softskills: "🧠",
  development: "🧠",
  early: "🌱",
  chess: "♟️",
  logic: "🧩",
  puzzle: "🧩",
};

/**
 * Renders a CMS-managed icon:
 * 1. An uploaded image (JPG/PNG/SVG) when `url` is set.
 * 2. An emoji (either directly passed or resolved from keyword/Lucide name like "Palette" -> 🎨).
 * 3. A fallback Lucide SVG icon if no emoji match exists.
 */
export function CmsIcon({
  url,
  emoji,
  className,
  alt = "",
}: {
  url?: string | null;
  emoji?: string | null;
  className?: string;
  alt?: string;
}) {
  if (url) {
    return <img src={url} alt={alt} className={cn("h-6 w-6 shrink-0 object-contain", className)} loading="lazy" />;
  }

  if (!emoji || !emoji.trim()) {
    return null;
  }

  const raw = emoji.trim();
  const cleanKey = raw.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Check keyword/Lucide mapping first
  if (cleanKey && EMOJI_MAP[cleanKey]) {
    return <span className={cn("shrink-0 leading-none text-2xl select-none", className)}>{EMOJI_MAP[cleanKey]}</span>;
  }

  // If it's already an emoji (contains non-ASCII or multi-byte unicode)
  const isDirectEmoji = /\p{Extended_Pictographic}/u.test(raw) || raw.length <= 4;
  if (isDirectEmoji && !/^[a-zA-Z0-9_\s-]+$/.test(raw)) {
    return <span className={cn("shrink-0 leading-none text-2xl select-none", className)}>{raw}</span>;
  }

  // Fallback: If it's a known Lucide icon name, render the Lucide SVG icon
  const LucideComp = (LucideIcons as unknown as Record<string, LucideIcon>)[raw];
  if (LucideComp) {
    return <LucideComp className={cn("h-6 w-6 shrink-0", className)} />;
  }

  return <span className={cn("shrink-0 leading-none", className)}>{raw}</span>;
}
