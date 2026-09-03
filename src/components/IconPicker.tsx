import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/svg+xml,image/webp";

/**
 * Icon picker for CMS entities: either an emoji / lucide name (text)
 * or an uploaded image (JPG / PNG / SVG / WEBP).
 */
export function IconPicker({
  icon,
  iconUrl,
  onChange,
  placeholder = "😀 or Sparkles",
  compact = false,
  className,
}: {
  icon: string | null;
  iconUrl: string | null;
  onChange: (patch: { icon?: string; icon_url?: string | null }) => void;
  placeholder?: string;
  compact?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) return toast.error("Max 2 MB");
    if (!file.type.startsWith("image/")) return toast.error("JPG, PNG or SVG only");
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return toast.error("Please sign in");
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${uid}/icons/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("public-images")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    setUploading(false);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("public-images").getPublicUrl(path);
    onChange({ icon_url: data.publicUrl });
    toast.success("Icon uploaded");
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background text-lg">
        {iconUrl ? <img src={iconUrl} alt="" className="h-full w-full object-contain p-1" /> : <span>{icon || "–"}</span>}
      </div>
      {!iconUrl && (
        <input
          value={icon ?? ""}
          onChange={(e) => onChange({ icon: e.target.value })}
          placeholder={placeholder}
          className={cn(
            "h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary",
            compact ? "w-20" : "w-32",
          )}
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Upload icon (JPG/PNG/SVG)"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:border-primary disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      </button>
      {iconUrl && (
        <button
          type="button"
          onClick={() => onChange({ icon_url: null })}
          title="Remove uploaded icon"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
