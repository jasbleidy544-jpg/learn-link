import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Student = { id: string; full_name: string; grade: string | null };

export default function SendMessageDialog() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !profile?.institution) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("profiles").select("id, full_name, grade")
        .eq("institution", profile.institution).neq("id", user?.id);
      setStudents(data || []);
    })();
  }, [open, profile, user]);

  const submit = async () => {
    if (!user || !studentId || !title.trim()) return;
    setSaving(true);
    const { error } = await (supabase as any).from("student_notifications").insert({
      student_id: studentId, sender_id: user.id, type: "message",
      title, body,
    });
    setSaving(false);
    if (error) { toast.error("No se pudo enviar el mensaje"); return; }
    toast.success("Mensaje enviado al estudiante");
    setOpen(false);
    setStudentId(""); setTitle(""); setBody("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-16 flex flex-col gap-2 w-full">
          <MessageCircle className="w-5 h-5" /> Mensaje individual
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar mensaje individual</DialogTitle>
          <DialogDescription>El estudiante lo verá en sus notificaciones.</DialogDescription>
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
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Asunto del mensaje" />
          </div>
          <div>
            <Label>Mensaje</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Escribe tu mensaje..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!studentId || !title.trim() || saving}>
            {saving ? "Enviando..." : "Enviar mensaje"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}