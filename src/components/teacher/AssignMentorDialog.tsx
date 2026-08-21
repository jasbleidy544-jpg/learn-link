import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type P = { id: string; full_name: string; grade: string | null; teacher_type: string | null };

export default function AssignMentorDialog() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<P[]>([]);
  const [mentors, setMentors] = useState<P[]>([]);
  const [studentId, setStudentId] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !profile?.institution) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("profiles").select("id, full_name, grade, teacher_type")
        .eq("institution", profile.institution).neq("id", user?.id);
      const all = (data || []) as P[];
      setStudents(all.filter((p) => !p.teacher_type));
      setMentors(all.filter((p) => p.teacher_type === "retired" || p.teacher_type === "active"));
    })();
  }, [open, profile, user]);

  const submit = async () => {
    if (!studentId) return;
    setSaving(true);
    const { error } = await (supabase as any).from("profiles")
      .update({ assigned_teacher_id: mentorId || null }).eq("id", studentId);
    setSaving(false);
    if (error) { toast.error("No se pudo asignar el mentor"); return; }
    toast.success("Asignación guardada");
    setOpen(false); setStudentId(""); setMentorId("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-16 flex flex-col gap-2 w-full">
          <UserCog className="w-5 h-5" /> Asignar mentor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar docente o mentor a un estudiante</DialogTitle>
          <DialogDescription>Define qué docente acompañará a cada estudiante.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Estudiante</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Selecciona un estudiante" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name} {s.grade ? `· ${s.grade}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mentor / docente</Label>
            <Select value={mentorId} onValueChange={setMentorId}>
              <SelectTrigger><SelectValue placeholder="Selecciona un docente" /></SelectTrigger>
              <SelectContent>
                {mentors.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.full_name} · {m.teacher_type === "retired" ? "Jubilado" : "Activo"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!studentId || saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
