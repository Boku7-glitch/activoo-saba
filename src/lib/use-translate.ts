import { useCallback, useState } from "react";
import { translateBatch } from "@/lib/translate.functions";

const CHUNK = 40;

/**
 * Translate admin content between Georgian and English.
 * Returns an array aligned 1:1 with the input (empty inputs stay empty).
 */
export function useTranslator(target: "en" | "ka" = "en") {
  const [busy, setBusy] = useState(false);

  const translate = useCallback(
    async (texts: string[]): Promise<string[]> => {
      const out = [...texts];
      const idx: number[] = [];
      const src: string[] = [];
      texts.forEach((t, i) => {
        if (typeof t === "string" && t.trim()) {
          idx.push(i);
          src.push(t.trim());
        }
      });
      if (src.length === 0) return out;

      setBusy(true);
      try {
        for (let i = 0; i < src.length; i += CHUNK) {
          const slice = src.slice(i, i + CHUNK);
          const res = await translateBatch({ data: { texts: slice, target } });
          const translations = (res as { translations: string[] }).translations ?? [];
          translations.forEach((v, k) => {
            const original = idx[i + k];
            if (original !== undefined && v) out[original] = v;
          });
        }
        return out;
      } finally {
        setBusy(false);
      }
    },
    [target],
  );

  return { translate, busy };
}
