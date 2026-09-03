import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { ImageUploader, GalleryUploader } from "@/components/ImageUploader";

export interface ContentBlock {
  title: string;
  title_en?: string;
  text: string;
  text_en?: string;
}

export interface TeacherRow {
  id?: string;
  first_name: string;
  last_name: string;
  first_name_en?: string | null;
  last_name_en?: string | null;
  bio?: string | null;
  bio_en?: string | null;
  photo_url?: string | null;
  video_url?: string | null;
  credentials: string[];
  credentials_en: string[];
  certificates: string[];
}

export function emptyBlock(): ContentBlock {
  return { title: "", title_en: "", text: "", text_en: "" };
}

export function emptyTeacher(): TeacherRow {
  return {
    first_name: "", last_name: "", first_name_en: "", last_name_en: "",
    bio: "", bio_en: "", photo_url: null, video_url: "",
    credentials: [], credentials_en: [], certificates: [],
  };
}

function Input({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
      )}
    </label>
  );
}

/** Repeatable title + paragraph blocks (bilingual). */
export function BlocksEditor({
  label, hint, value, onChange, addLabel = "Add item",
}: {
  label: string;
  hint?: string;
  value: ContentBlock[];
  onChange: (v: ContentBlock[]) => void;
  addLabel?: string;
}) {
  const list = value ?? [];
  const patch = (i: number, p: Partial<ContentBlock>) =>
    onChange(list.map((b, j) => (j === i ? { ...b, ...p } : b)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      {hint && <p className="mb-2 text-[11px] text-muted-foreground">{hint}</p>}
      <div className="space-y-3">
        {list.map((b, i) => (
          <div key={i} className="rounded-2xl border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">#{i + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} className="rounded-lg p-1 hover:bg-surface-soft"><ChevronUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(i, 1)} className="rounded-lg p-1 hover:bg-surface-soft"><ChevronDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="rounded-lg p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Input label="Title (KA)" value={b.title ?? ""} onChange={(v) => patch(i, { title: v })} />
              <Input label="Title (EN)" value={b.title_en ?? ""} onChange={(v) => patch(i, { title_en: v })} />
              <Input label="Text (KA)" value={b.text ?? ""} onChange={(v) => patch(i, { text: v })} multiline />
              <Input label="Text (EN)" value={b.text_en ?? ""} onChange={(v) => patch(i, { text_en: v })} multiline />
            </div>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...list, emptyBlock()])}
          className="flex items-center gap-1 rounded-xl bg-surface-soft px-3 py-1.5 text-xs font-bold hover:bg-muted">
          <Plus className="h-3 w-3" /> {addLabel}
        </button>
      </div>
    </div>
  );
}

/** Teachers with photo, video, credentials and certificate images. */
export function TeachersEditor({ value, onChange }: { value: TeacherRow[]; onChange: (v: TeacherRow[]) => void }) {
  const list = value ?? [];
  const [open, setOpen] = useState<number | null>(0);
  const patch = (i: number, p: Partial<TeacherRow>) =>
    onChange(list.map((t, j) => (j === i ? { ...t, ...p } : t)));

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold">Teachers</span>
      <p className="mb-2 text-[11px] text-muted-foreground">Name, surname, photo, intro video, credentials and certificate images.</p>
      <div className="space-y-3">
        {list.map((t, i) => {
          const expanded = open === i;
          return (
            <div key={i} className="rounded-2xl border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setOpen(expanded ? null : i)} className="flex items-center gap-2 text-sm font-bold">
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {[t.first_name, t.last_name].filter(Boolean).join(" ") || `Teacher #${i + 1}`}
                </button>
                <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="rounded-lg p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </div>
              {expanded && (
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Input label="First name (KA)" value={t.first_name ?? ""} onChange={(v) => patch(i, { first_name: v })} />
                  <Input label="Last name (KA)" value={t.last_name ?? ""} onChange={(v) => patch(i, { last_name: v })} />
                  <Input label="First name (EN)" value={t.first_name_en ?? ""} onChange={(v) => patch(i, { first_name_en: v })} />
                  <Input label="Last name (EN)" value={t.last_name_en ?? ""} onChange={(v) => patch(i, { last_name_en: v })} />
                  <Input label="About (KA)" value={t.bio ?? ""} onChange={(v) => patch(i, { bio: v })} multiline />
                  <Input label="About (EN)" value={t.bio_en ?? ""} onChange={(v) => patch(i, { bio_en: v })} multiline />
                  <Input label="Credentials KA (one per line)" value={(t.credentials ?? []).join("\n")}
                    onChange={(v) => patch(i, { credentials: v.split("\n").map((s) => s.trim()).filter(Boolean) })} multiline />
                  <Input label="Credentials EN (one per line)" value={(t.credentials_en ?? []).join("\n")}
                    onChange={(v) => patch(i, { credentials_en: v.split("\n").map((s) => s.trim()).filter(Boolean) })} multiline />
                  <Input label="Video URL (YouTube / Vimeo / mp4)" value={t.video_url ?? ""} onChange={(v) => patch(i, { video_url: v })} />
                  <div className="md:col-span-2">
                    <ImageUploader label="Photo" folder="teachers" value={t.photo_url ?? null} onChange={(url) => patch(i, { photo_url: url })} />
                  </div>
                  <div className="md:col-span-2">
                    <GalleryUploader label="Certificates" value={t.certificates ?? []} folder="certificates" onChange={(urls) => patch(i, { certificates: urls })} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button type="button" onClick={() => { onChange([...list, emptyTeacher()]); setOpen(list.length); }}
          className="flex items-center gap-1 rounded-xl bg-surface-soft px-3 py-1.5 text-xs font-bold hover:bg-muted">
          <Plus className="h-3 w-3" /> Add teacher
        </button>
      </div>
    </div>
  );
}
