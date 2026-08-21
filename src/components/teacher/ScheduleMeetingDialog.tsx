import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Student = { id: string; full_name: string; grade: string | null };

interface Props { scope?: "institution" | "assigned" }
export default function ScheduleMeetingDialog({ scope = "institution" }: Props = {}) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      if (scope === "assigned") {
        const { data: asigns } = await (supabase as any)
          .from("asignaciones").select("estudiante_id").eq("docente_id", user.id);
        const ids = Array.from(new Set((asigns || []).map((a: any) => a.estudiante_id))).filter(Boolean);
        if (ids.length === 0) { setStudents([]); return; }
        const { data } = await (supabase as any)
          .from("profiles").select("id, full_name, grade").in("id", ids);
        const list = (data || []) as Student[];
        setStudents(list);
        if (list.length === 1) setStudentId(list[0].id);
      } else if (profile?.institution) {
        const { data } = await (supabase as any)
          .from("profiles").select("id, full_name, grade")
          .eq("institution", profile.institution).neq("id", user.id);
        setStudents((data || []) as Student[]);
      } else {
        setStudents([]);
      }
    })();
  }, [open, profile, user, scope]);

  const submit = async () => {
    if (!user || !studentId || !date || !time || !title.trim()) return;
    setSaving(true);
    const salaId = Math.random().toString(36).substring(2, 10);
    const meet = `https://meet.google.com/${salaId}`;
    const scheduled = new Date(`${date}T${time}`).toISOString();
    const teacherName = profile?.full_name || "Tu mentor";
    const { error } = await (supabase as any).from("meetings").insert({
      host_id: user.id,
      student_id: studentId,
      title: title.trim(),
      description: topic || null,
      scheduled_at: scheduled,
      meet_link: meet,
      status: "scheduled",
    });
    if (error) {
      toast.error(`No se pudo agendar la mentoría: ${error.message}`);
      setSaving(false);
      return;
    }
    const { error: notifErr } = await (supabase as any).from("student_notifications").insert({
      student_id: studentId,
      sender_id: user.id,
      type: "meeting",
      title: `📅 Nueva mentoría: ${title.trim()}`,
      message: `${teacherName} agendó una sesión contigo el ${new Date(scheduled).toLocaleString()}.`,
      body: `${teacherName} agendó una sesión contigo el ${new Date(scheduled).toLocaleString()}.${topic ? ` Tema: ${topic}` : ""}`,
      link: meet,
    });
    if (notifErr) toast.warning(`Mentoría creada, pero no se notificó: ${notifErr.message}`);
    else toast.success("✓ Mentoría agendada. El estudiante fue notificado.");
    setOpen(false);
    setStudentId(""); setDate(""); setTime(""); setTitle(""); setTopic("");
    setSaving(false);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-16 flex flex-col gap-2 w-full">
          <Video className="w-5 h-5" /> Agendar mentoría
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar mentoría con un estudiante</DialogTitle>
          <DialogDescription>El estudiante recibirá una notificación con el enlace de Meet.</DialogDescription>
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
            {students.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">No tienes estudiantes asignados aún.</p>
            )}
          </div>
          <div>
            <Label>Título de la sesión</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Repaso de Matemáticas, Apoyo emocional…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Descripción (opcional)</Label>
            <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Temas a tratar, preparación necesaria, materiales…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!studentId || !date || !time || !title.trim() || saving}>
            {saving ? "Agendando..." : "Agendar y notificar estudiante"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}