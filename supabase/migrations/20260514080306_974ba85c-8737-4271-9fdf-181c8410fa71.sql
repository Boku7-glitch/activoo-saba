CREATE TABLE public.translations_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_hash text NOT NULL,
  source_lang text NOT NULL DEFAULT 'ka',
  target_lang text NOT NULL,
  source_text text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_hash, source_lang, target_lang)
);
CREATE INDEX idx_translations_lookup ON public.translations_cache (source_hash, target_lang);
ALTER TABLE public.translations_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Translations readable by everyone" ON public.translations_cache FOR SELECT USING (true);