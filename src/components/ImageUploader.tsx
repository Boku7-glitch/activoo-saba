import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
}

export function ImageUploader({ value, onChange, folder = "uploads", label = "Image" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5 MB");
    if (!file.type.startsWith("image/")) return toast.error("Image only");
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return toast.error("Please sign in to upload images");
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${uid}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("public-images").upload(path, file, {
      cacheControl: "3600", upsert: false, contentType: file.type,
    });
    setUploading(false);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("public-images").getPublicUrl(path);
    onChange(data.publicUrl);
    toast.success("Uploaded");
  };


  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      <div className="flex items-center gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-soft">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold hover:border-primary disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex h-8 items-center justify-center gap-1 rounded-xl px-2 text-xs text-destructive hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          )}
        </div>
      </div>
    </label>
  );
}

interface GalleryProps {
  value: string[] | null;
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
}

export function GalleryUploader({ value, onChange, folder = "gallery", label = "Gallery" }: GalleryProps) {
  const list = value ?? [];
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      <div className="flex flex-wrap gap-2">
        {list.map((url, i) => (
          <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-border">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(list.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-destructive shadow"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div className="h-20 w-20">
          <ImageUploader
            value={null}
            label=""
            folder={folder}
            onChange={(url) => { if (url) onChange([...list, url]); }}
          />
        </div>
      </div>
    </div>
  );
}
