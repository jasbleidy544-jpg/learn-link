import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function MentorshipDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [teacher, setTeacher] = useState("");
  const [date, setDate] = useState("");
  const [topic, setTopic] = useState("");

  const submit = async () => {
    if (!user || !date) return;
    const meet = "https://meet.google.com/new";
    await (supabase as any).from("mentorship_sessions").insert({
      student_id: user.id,
      teacher_name: teacher || "Por asignar",
      scheduled_at: new Date(date).toISOString(),
      topic,
      meet_link: meet,
    });
    toast({ title: "Mentoría agendada", description: "Se generó tu enlace de Meet." });
    setOpen(false);
    setTeacher(""); setDate(""); setTopic("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
          <Video className="w-6 h-6" /> Agendar mentoría
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Agendar mentoría</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Maestro / mentor</Label>
            <Input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Nombre del mentor" />
          </div>
          <div className="space-y-1">
            <Label>Fecha y hora</Label>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Tema</Label>
            <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="¿Qué quieres trabajar?" />
          </div>
          <Button className="w-full" onClick={submit} disabled={!date}>Confirmar y crear Meet</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}