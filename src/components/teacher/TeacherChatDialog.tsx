import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ChatPanel from "@/components/chat/ChatPanel";

type Student = { id: string; full_name: string; grade: string | null };

interface Props { scope?: "institution" | "assigned" }

export default function TeacherChatDialog({ scope = "institution" }: Props) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [peerId, setPeerId] = useState<string>("");

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      let q = (supabase as any).from("profiles").select("id, full_name, grade").neq("id", user.id);
      if (scope === "assigned") q = q.eq("assigned_teacher_id", user.id);
      else if (profile?.institution) q = q.eq("institution", profile.institution);
      const { data } = await q;
      setStudents(data || []);
    })();
  }, [open, user, profile, scope]);

  const peer = students.find((s) => s.id === peerId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-16 flex flex-col gap-2 w-full">
          <MessageCircle className="w-5 h-5" /> Chat con estudiantes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chat individual</DialogTitle>
          <DialogDescription>Conversa de forma privada con un estudiante.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Estudiante</Label>
            <Select value={peerId} onValueChange={setPeerId}>
              <SelectTrigger><SelectValue placeholder="Selecciona un estudiante" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name} {s.grade ? `· ${s.grade}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {peer && (
            <div className="border rounded-lg overflow-hidden">
              <ChatPanel peerId={peer.id} peerName={peer.full_name} notifyStudent />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}