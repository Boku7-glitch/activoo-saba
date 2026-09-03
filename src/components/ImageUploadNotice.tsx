import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const IMAGE_UPLOAD_NOTICE_KEY = "image_upload_notice";

const DEFAULT_KA =
  "ყურადღება: ატვირთული ვიზუალები უნდა შეესაბამებოდეს საიტის მოხმარების პირობებს (T&C). აკრძალულია შეუფერებელი, შეურაცხმყოფელი ან სხვისი საავტორო უფლებებით დაცული მასალები.";
const DEFAULT_EN =
  "Note: all uploaded images must comply with the site's Terms & Conditions. Inappropriate, offensive, or copyrighted content is not allowed.";

/**
 * Warning shown under image uploaders in editors.
 * Text is editable from the main admin (Site copy → Image uploads).
 */
export function ImageUploadNotice() {
  const { lang } = useI18n();
  const [remote, setRemote] = useState<{ ka: string; en: string } | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value,value_en")
      .eq("key", IMAGE_UPLOAD_NOTICE_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const ka = (data.value as { text?: string } | null)?.text ?? "";
        const en = (data.value_en as { text?: string } | null)?.text ?? "";
        if (ka || en) setRemote({ ka, en });
      });
  }, []);

  const text =
    lang === "en"
      ? remote?.en || remote?.ka || DEFAULT_EN
      : remote?.ka || remote?.en || DEFAULT_KA;

  return (
    <p className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs leading-snug text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{text}</span>
    </p>
  );
}
