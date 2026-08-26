import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

interface Input {
  texts: string[];
  target: "en" | "ka";
}

const MAX_BATCH = 50;
const MAX_LEN = 4000;

function hashText(s: string) {
  return createHash("sha256").update(s).digest("hex").slice(0, 32);
}

async function callLovableAI(texts: string[], target: "en" | "ka"): Promise<string[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const targetName = target === "en" ? "English" : "Georgian";
  const sourceName = target === "en" ? "Georgian" : "English";

  const numbered = texts.map((t, i) => `${i + 1}. ${t.replace(/\n/g, " ")}`).join("\n");
  const prompt = `You are a professional translator. Translate the following ${texts.length} text snippets from ${sourceName} to ${targetName}.
Rules:
- Output ONLY the translations, one per line, in the same numbered order: "1. ...", "2. ...", etc.
- Keep proper nouns, brand names, emojis, and numbers as-is.
- Preserve tone and brevity. Do not add explanations.

Texts:
${numbered}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content ?? "";
  // Parse numbered lines back
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const out: string[] = new Array(texts.length).fill("");
  for (const line of lines) {
    const m = line.match(/^(\d+)[.)\]]\s*(.+)$/);
    if (m) {
      const idx = parseInt(m[1], 10) - 1;
      if (idx >= 0 && idx < texts.length) out[idx] = m[2].trim();
    }
  }
  // Fallback: any missing -> source
  return out.map((v, i) => v || texts[i]);
}

export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((input: Input) => {
    if (!input || !Array.isArray(input.texts)) throw new Error("texts required");
    if (input.target !== "en" && input.target !== "ka") throw new Error("invalid target");
    const texts = input.texts
      .map((t) => (typeof t === "string" ? t : ""))
      .map((t) => t.slice(0, MAX_LEN))
      .filter((t) => t.trim().length > 0)
      .slice(0, MAX_BATCH);
    return { texts, target: input.target };
  })
  .handler(async ({ data }) => {
    const { texts, target } = data;
    if (texts.length === 0) return { translations: [] as string[] };

    const sourceLang = target === "en" ? "ka" : "en";
    const url = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const hashes = texts.map(hashText);
    const { data: cached } = await admin
      .from("translations_cache")
      .select("source_hash, translated_text")
      .in("source_hash", hashes)
      .eq("target_lang", target)
      .eq("source_lang", sourceLang);

    const cacheMap = new Map<string, string>();
    (cached ?? []).forEach((r) => cacheMap.set(r.source_hash as string, r.translated_text as string));

    const missingIdx: number[] = [];
    const missingTexts: string[] = [];
    texts.forEach((t, i) => {
      if (!cacheMap.has(hashes[i])) {
        missingIdx.push(i);
        missingTexts.push(t);
      }
    });

    if (missingTexts.length > 0) {
      try {
        const translated = await callLovableAI(missingTexts, target);
        const rows = missingIdx.map((origIdx, k) => ({
          source_hash: hashes[origIdx],
          source_lang: sourceLang,
          target_lang: target,
          source_text: texts[origIdx],
          translated_text: translated[k],
        }));
        await admin.from("translations_cache").upsert(rows, { onConflict: "source_hash,source_lang,target_lang" });
        translated.forEach((v, k) => cacheMap.set(hashes[missingIdx[k]], v));
      } catch (err) {
        console.error("translate AI error", err);
        // fallback: source text
        missingIdx.forEach((i) => cacheMap.set(hashes[i], texts[i]));
      }
    }

    return { translations: texts.map((_, i) => cacheMap.get(hashes[i]) ?? texts[i]) };
  });
