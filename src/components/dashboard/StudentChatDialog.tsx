import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ChatPanel from "@/components/chat/ChatPanel";

type T = { id: string; full_name: string; teacher_type: string | null };

export default function StudentChatDialog() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<T[]>([]);
  const [peerId, setPeerId] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const ids = new Set<string>();
      // Institution teachers (active or retired, not admin)
      if (profile?.institution) {
        const { data } = await (supabase as any).from("profiles")
          .select("id, full_name, teacher_type, institution")
          .eq("institution", profile.institution).neq("id", user.id);
        (data || []).forEach((p: any) => {
          if (p.teacher_type && p.teacher_type !== "admin") ids.add(p.id);
        });
      }
      // Assigned mentor (if any, even cross-institution)
      if (profile?.assigned_teacher_id) ids.add(profile.assigned_teacher_id);
      if (ids.size === 0) { setTeachers([]); return; }
      const { data: tdata } = await (supabase as any).from("profiles")
        .select("id, full_name, teacher_type").in("id", Array.from(ids));
      setTeachers((tdata || []).filter((t: any) => t.teacher_type !== "admin"));
    })();
  }, [open, user, profile]);

  const peer = teachers.find((t) => t.id === peerId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
          <MessageSquare className="w-6 h-6" /> Chat con mis docentes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Habla con tus docentes</DialogTitle>
          <DialogDescription>Conversación privada con un docente o mentor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Docente</Label>
            <Select value={peerId} onValueChange={setPeerId}>
              <SelectTrigger>
                <SelectValue placeholder={teachers.length ? "Selecciona un docente" : "Sin docentes disponibles"} />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name} · {t.teacher_type === "retired" ? "Voluntario" : "Docente"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {peer && (
            <div className="border rounded-lg overflow-hidden">
              <ChatPanel peerId={peer.id} peerName={peer.full_name} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}