import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NotebookPen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  meetingId: string;
  studentName: string;
  initialNotes?: string | null;
  onSaved?: () => void;
  trigger?: React.ReactNode;
}

export default function SessionNotesDialog({ meetingId, studentName, initialNotes, onSaved, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("meetings")
      .update({ status: "completed", notes: notes.trim() || null })
      .eq("id", meetingId);
    setSaving(false);
    if (error) { toast.error("No se pudieron guardar las notas: " + error.message); return; }
    toast.success("Sesión finalizada y notas guardadas.");
    setOpen(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <NotebookPen className="w-3.5 h-3.5 mr-1" /> Notas de la sesión
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar sesión con {studentName}</DialogTitle>
          <DialogDescription>
            Escribe un pequeño resumen de lo hablado. La institución podrá ver que el acompañamiento
            se está llevando a cabo.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='Ej: "Hablamos sobre la ansiedad antes de los exámenes, acordamos estudiar en bloques de 20 minutos."'
          rows={5}
        />
        <DialogFooter>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Guardando..." : "Guardar y marcar como completada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
