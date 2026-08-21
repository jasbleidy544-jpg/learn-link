import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface Props {
  teacherId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TeacherDetailDialog({ teacherId, open, onOpenChange }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !teacherId) return;
    (async () => {
      setLoadError(null);
      console.log(`[TeacherDetailDialog] Buscando asignaciones para docente ID: ${teacherId}`);
      const { data: p } = await (supabase as any)
        .from("profiles").select("*").eq("id", teacherId).maybeSingle();
      setProfile(p);

      const { data: asignaciones, error } = await (supabase as any)
        .from("asignaciones")
        .select("estudiante_id, profiles:estudiante_id ( id, full_name, email, grade )")
        .eq("docente_id", teacherId);

      if (error) {
        console.error("[TeacherDetailDialog] Error consultando asignaciones:", error);
        setLoadError(error.message);
        setStudents([]);
        return;
      }
      console.log(`[TeacherDetailDialog] Asignaciones encontradas: ${asignaciones?.length ?? 0}`, asignaciones);
      const rows = (asignaciones || [])
        .map((a: any) => a.profiles)
        .filter(Boolean);
      setStudents(rows);
    })();
  }, [teacherId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{profile?.full_name || "Docente"}</DialogTitle>
          <DialogDescription>{profile?.subjects || "—"} · {profile?.email}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-3">
          <div className="mb-3 p-2 rounded border border-yellow-500/40 bg-yellow-500/5 text-xs font-mono space-y-1">
            <div>Buscando asignaciones para docente ID: <span className="text-yellow-300">{teacherId}</span></div>
            <div>Asignaciones encontradas: <span className="text-yellow-300">{students.length}</span></div>
            {loadError && <div className="text-red-400">Error: {loadError}</div>}
          </div>
          <section>
            <h3 className="font-semibold flex items-center gap-2 mb-2"><Users className="w-4 h-4" /> Estudiantes asignados a este docente ({students.length})</h3>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">Este docente no tiene estudiantes asignados aún.</p>
            ) : (
              <div className="space-y-2">
                {students.map((s) => (
                  <div key={s.id} className="cloud-card p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.full_name}</div>
                      <div className="text-xs text-muted-foreground">{s.grade || "—"} · {s.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}