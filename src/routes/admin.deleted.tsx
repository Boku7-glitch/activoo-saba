import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RotateCcw, Trash2, School as SchoolIcon, BookOpen, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/deleted")({
  component: AdminDeleted,
});

interface DeletedSchool {
  id: string;
  name: string;
  slug: string;
  district: string;
  deleted_at: string;
  image_url: string | null;
}

interface DeletedClass {
  id: string;
  title: string;
  school_id: string;
  deleted_at: string;
  schools?: { name: string } | null;
}

type Tab = "schools" | "classes";

function AdminDeleted() {
  const [tab, setTab] = useState<Tab>("schools");
  const [schools, setSchools] = useState<DeletedSchool[] | null>(null);
  const [classes, setClasses] = useState<DeletedClass[] | null>(null);

  const load = useCallback(async () => {
    const [{ data: ss }, { data: cs }] = await Promise.all([
      supabase.from("schools").select("id,name,slug,district,deleted_at,image_url").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
      supabase.from("classes").select("id,title,school_id,deleted_at,schools(name)").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
    ]);
    setSchools((ss as unknown as DeletedSchool[]) ?? []);
    setClasses((cs as unknown as DeletedClass[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const restoreSchool = async (id: string) => {
    const { error } = await supabase.from("schools").update({ deleted_at: null, deleted_by: null, is_visible: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("School restored as hidden. Publish it to show it on the site.");
    load();
  };

  const restoreSchoolWithClasses = async (id: string) => {
    const { error } = await supabase.from("schools").update({ deleted_at: null, deleted_by: null, is_visible: false }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("classes").update({ deleted_at: null, deleted_by: null, is_visible: false }).eq("school_id", id).not("deleted_at", "is", null);
    toast.success("School and its classes restored as hidden. Publish them when ready.");
    load();
  };

  const restoreClass = async (id: string) => {
    const { error } = await supabase.from("classes").update({ deleted_at: null, deleted_by: null, is_visible: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Class restored as hidden. Publish it to show it on the site.");
    load();
  };

  const purgeSchool = async (id: string) => {
    if (!confirm("Permanently erase this school and all its classes? This cannot be undone.")) return;
    await supabase.from("classes").delete().eq("school_id", id);
    const { error } = await supabase.from("schools").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Erased permanently");
    load();
  };

  const purgeClass = async (id: string) => {
    if (!confirm("Permanently erase this class? This cannot be undone.")) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Erased permanently");
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Deleted</h1>
        <p className="text-sm text-muted-foreground">
          Schools and classes removed by their owners or by admins. All content is kept and can be restored.
        </p>
      </div>

      <div className="flex gap-2">
        <TabBtn active={tab === "schools"} onClick={() => setTab("schools")} icon={<SchoolIcon className="h-4 w-4" />} label={`Schools (${schools?.length ?? 0})`} />
        <TabBtn active={tab === "classes"} onClick={() => setTab("classes")} icon={<BookOpen className="h-4 w-4" />} label={`Classes (${classes?.length ?? 0})`} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-soft text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">{tab === "schools" ? "School" : "Class"}</th>
                <th className="px-4 py-3 text-left">{tab === "schools" ? "District" : "School"}</th>
                <th className="px-4 py-3 text-left">Deleted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tab === "schools" ? (
                !schools ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : schools.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nothing deleted.</td></tr>
                ) : schools.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-soft/50">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {s.image_url && <img src={s.image_url} alt="" className="h-8 w-8 rounded-lg object-cover" />}
                        {s.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">{s.district}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.deleted_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <a href={`/schools/${s.slug}?preview=1`} target="_blank" rel="noreferrer" className="mr-2 inline-flex items-center gap-1.5 rounded-lg bg-surface-soft px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                        <ExternalLink className="h-3.5 w-3.5" /> Preview
                      </a>
                      <button onClick={() => restoreSchoolWithClasses(s.id)} className="mr-2 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-bold text-background hover:opacity-90">
                        <RotateCcw className="h-3.5 w-3.5" /> Restore all
                      </button>
                      <button onClick={() => restoreSchool(s.id)} className="mr-2 rounded-lg bg-surface-soft px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                        School only
                      </button>
                      <button onClick={() => purgeSchool(s.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10" title="Erase permanently">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                !classes ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : classes.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nothing deleted.</td></tr>
                ) : classes.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-soft/50">
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.schools?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.deleted_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <a href={`/class/${c.id}?preview=1`} target="_blank" rel="noreferrer" className="mr-2 inline-flex items-center gap-1.5 rounded-lg bg-surface-soft px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                        <ExternalLink className="h-3.5 w-3.5" /> Preview
                      </a>
                      <button onClick={() => restoreClass(c.id)} className="mr-2 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-bold text-background hover:opacity-90">
                        <RotateCcw className="h-3.5 w-3.5" /> Restore
                      </button>
                      <button onClick={() => purgeClass(c.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10" title="Erase permanently">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${active ? "bg-foreground text-background shadow-soft" : "bg-surface-soft text-foreground/70 hover:bg-muted"}`}
    >
      {icon} {label}
    </button>
  );
}
