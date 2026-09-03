import { useCallback, useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export interface ReviewRow {
  id: string;
  user_id: string;
  author_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <div className="flex gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= value ? "fill-current" : "text-muted-foreground/40"}`} />
      ))}
    </div>
  );
}

export function ReviewsSection({
  classId, schoolId, enabled,
}: {
  classId: string;
  schoolId: string | null;
  enabled: boolean;
}) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("class_reviews")
      .select("id,user_id,author_name,rating,comment,created_at")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });
    setReviews((data as ReviewRow[]) ?? []);
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  const mine = user ? reviews.find((r) => r.user_id === user.id) : undefined;

  useEffect(() => {
    if (mine) { setRating(mine.rating); setComment(mine.comment ?? ""); }
  }, [mine]);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const submit = async () => {
    if (!user || !schoolId) return;
    if (comment.trim().length > 1000) return toast.error("Review is too long (max 1000 characters)");
    setSaving(true);
    const payload = {
      class_id: classId,
      school_id: schoolId,
      user_id: user.id,
      author_name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || null,
      rating,
      comment: comment.trim() || null,
    };
    const { error } = mine
      ? await supabase.from("class_reviews").update(payload as never).eq("id", mine.id)
      : await supabase.from("class_reviews").insert(payload as never);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(mine ? "Review updated" : "Thanks for your review!");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("class_reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <div className="mb-3">
        <div className="mb-2 h-1 w-8 rounded-full bg-amber-400" />
        <h2 className="text-lg font-extrabold">Reviews</h2>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <div className="text-4xl font-extrabold">{avg ? avg.toFixed(2) : "—"}</div>
          <Stars value={Math.round(avg)} />
          <div className="mt-1 text-xs text-muted-foreground">{reviews.length} review{reviews.length === 1 ? "" : "s"}</div>
        </div>
        <div className="ml-auto">
          {!enabled ? (
            <p className="text-xs text-muted-foreground">Reviews are closed for this club.</p>
          ) : !user ? (
            <Link to="/auth" className="inline-flex rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background">
              Sign in to leave a review
            </Link>
          ) : (
            <button onClick={() => setOpen((v) => !v)} className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background">
              {mine ? "Edit your review" : "Leave a review"}
            </button>
          )}
        </div>
      </div>

      {enabled && user && open && (
        <div className="mb-4 rounded-2xl border border-border p-4">
          <span className="mb-1 block text-xs font-semibold">Your rating</span>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} stars`}>
                <Star className={`h-7 w-7 ${i <= rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40"}`} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            maxLength={1000}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Tell other parents about your experience…"
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-surface-soft">Cancel</button>
            <button onClick={submit} disabled={saving} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
              {saving ? "Sending…" : "Publish review"}
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-soft text-xs font-bold">
                  {(r.author_name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="text-xs">
                  <div className="font-bold">{r.author_name ?? "Parent"}</div>
                  <div className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                {user?.id === r.user_id && (
                  <button onClick={() => remove(r.id)} className="ml-auto rounded-lg p-1 text-destructive hover:bg-destructive/10" aria-label="Delete review">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-2"><Stars value={r.rating} size="h-3 w-3" /></div>
              {r.comment && <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-foreground/80">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
