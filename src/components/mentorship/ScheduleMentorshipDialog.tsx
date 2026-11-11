import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarPlus, GraduationCap, HeartHandshake, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { generateJitsiLink } from "@/lib/jitsi";

type Mentor = { id: string; full_name: string; teacher_type: string | null; subjects: string | null };
type AvailBlock = { day_of_week: number; start_time: string; end_time: string };
type Slot = { date: Date; label: string };

const SLOT_MINUTES = 30;
const DAY_LABEL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

interface Props {
  trigger?: React.ReactNode;
}

export default function ScheduleMentorshipDialog({ trigger }: Props) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"mentor" | "slot" | "confirm">("mentor");
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setStep("mentor");
    setSelectedMentor(null);
    setSelectedSlot(null);
    setTitle("");
    (async () => {
      setLoadingMentors(true);
      const { data: asigns } = await (supabase as any)
        .from("asignaciones").select("docente_id").eq("estudiante_id", user.id);
      const ids = Array.from(new Set((asigns || []).map((a: any) => a.docente_id))).filter(Boolean);
      if (ids.length === 0) { setMentors([]); setLoadingMentors(false); return; }
      const { data } = await (supabase as any)
        .from("profiles").select("id, full_name, teacher_type, subjects").in("id", ids);
      setMentors((data || []) as Mentor[]);
      setLoadingMentors(false);
    })();
  }, [open, user]);

  const pickMentor = async (m: Mentor) => {
    setSelectedMentor(m);
    setStep("slot");
    setLoadingSlots(true);

    const [{ data: avail }, { data: mentorMeetings }, { data: myMeetings }] = await Promise.all([
      (supabase as any).from("mentor_availability").select("day_of_week, start_time, end_time").eq("mentor_id", m.id),
      (supabase as any).from("meetings").select("scheduled_at").eq("host_id", m.id).in("status", ["scheduled", "pending"]),
      user ? (supabase as any).from("meetings").select("scheduled_at").eq("student_id", user.id).in("status", ["scheduled", "pending"]) : Promise.resolve({ data: [] }),
    ]);

    const busy = new Set<number>(
      [...(mentorMeetings || []), ...(myMeetings || [])].map((mm: any) => new Date(mm.scheduled_at).getTime())
    );

    const blocks = (avail || []) as AvailBlock[];
    const generated: Slot[] = [];
    const now = new Date();
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const day = new Date(now);
      day.setDate(now.getDate() + dayOffset);
      const weekday = day.getDay();
      const dayBlocks = blocks.filter((b) => b.day_of_week === weekday);
      for (const b of dayBlocks) {
        const [sh, sm] = b.start_time.split(":").map(Number);
        const [eh, em] = b.end_time.split(":").map(Number);
        const slotStart = new Date(day); slotStart.setHours(sh, sm, 0, 0);
        const blockEnd = new Date(day); blockEnd.setHours(eh, em, 0, 0);
        for (let t = new Date(slotStart); t.getTime() + SLOT_MINUTES * 60000 <= blockEnd.getTime(); t.setMinutes(t.getMinutes() + SLOT_MINUTES)) {
          const slotDate = new Date(t);
          if (slotDate.getTime() <= now.getTime() + 15 * 60000) continue; // al menos 15 min de anticipación
          if (busy.has(slotDate.getTime())) continue;
          generated.push({
            date: slotDate,
            label: `${DAY_LABEL[slotDate.getDay()]} ${slotDate.getDate()}/${slotDate.getMonth() + 1} · ${slotDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`,
          });
        }
      }
    }
    generated.sort((a, b) => a.date.getTime() - b.date.getTime());
    setSlots(generated);
    setLoadingSlots(false);
  };

  const slotsByDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    slots.forEach((s) => {
      const key = s.date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [slots]);

  const confirm = async () => {
    if (!user || !selectedMentor || !selectedSlot) return;
    setSaving(true);
    const meetLink = generateJitsiLink();
    const finalTitle = title.trim() || `Mentoría con ${selectedMentor.full_name}`;
    const { error } = await (supabase as any).from("meetings").insert({
      host_id: selectedMentor.id,
      student_id: user.id,
      title: finalTitle,
      description: null,
      scheduled_at: selectedSlot.date.toISOString(),
      meet_link: meetLink,
      status: "pending",
    });
    if (error) {
      toast.error("No se pudo agendar: " + error.message);
      setSaving(false);
      return;
    }
    await (supabase as any).from("student_notifications").insert({
      student_id: selectedMentor.id,
      type: "meeting",
      title: `📅 Nueva solicitud de mentoría: ${finalTitle}`,
      content: `${profile?.full_name || "Un estudiante"} quiere agendar una mentoría contigo el ${selectedSlot.date.toLocaleString("es-CO")}. Entra a "Mis Mentorías" para aceptarla o rechazarla.`,
      link: null,
    });
    toast.success("¡Solicitud enviada! Tu mentor debe confirmarla.");
    setSaving(false);
    setOpen(false);
  };

  const mentorLabel = (m: Mentor) =>
    m.teacher_type === "retired" ? "Docente jubilado voluntario" : "Docente activo";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="w-full">
            <CalendarPlus className="w-4 h-4 mr-2" /> Agendar nueva sesión
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "mentor" && "¿Con quién quieres agendar?"}
            {step === "slot" && `Horarios de ${selectedMentor?.full_name}`}
            {step === "confirm" && "Confirmar sesión"}
          </DialogTitle>
          <DialogDescription>
            {step === "mentor" && "Elige uno de tus mentores asignados."}
            {step === "slot" && "Solo se muestran los espacios libres de los próximos 7 días."}
            {step === "confirm" && "Revisa los datos antes de confirmar."}
          </DialogDescription>
        </DialogHeader>

        {step === "mentor" && (
          <div className="space-y-2">
            {loadingMentors ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando tus mentores...
              </div>
            ) : mentors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aún no tienes docentes o mentores asignados.
              </p>
            ) : (
              mentors.map((m) => (
                <button
                  key={m.id}
                  onClick={() => pickMentor(m)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {m.teacher_type === "retired" ? (
                        <HeartHandshake className="w-4 h-4 text-pink-400" />
                      ) : (
                        <GraduationCap className="w-4 h-4 text-primary" />
                      )}
                      {m.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{mentorLabel(m)}{m.subjects ? ` · ${m.subjects}` : ""}</p>
                  </div>
                  <Badge variant="outline">Elegir</Badge>
                </button>
              ))
            )}
          </div>
        )}

        {step === "slot" && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("mentor")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Cambiar mentor
            </Button>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Buscando espacios libres...
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Este mentor no tiene horarios disponibles en los próximos 7 días. Intenta más tarde
                o elige otro mentor.
              </p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {slotsByDay.map(([day, daySlots]) => (
                  <div key={day}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 capitalize">{day}</p>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((s) => (
                        <Button
                          key={s.date.toISOString()}
                          size="sm"
                          variant={selectedSlot?.date.getTime() === s.date.getTime() ? "default" : "outline"}
                          onClick={() => { setSelectedSlot(s); setStep("confirm"); }}
                        >
                          {s.date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "confirm" && selectedMentor && selectedSlot && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("slot")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Cambiar horario
            </Button>
            <div className="rounded-lg border border-border p-3 space-y-1 bg-card/50">
              <p className="text-sm">👤 <strong>{selectedMentor.full_name}</strong></p>
              <p className="text-sm">
                📆 {selectedSlot.date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })} ·{" "}
                {selectedSlot.date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div>
              <Label>Título de la sesión (opcional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Mentoría con ${selectedMentor.full_name}`} />
            </div>
            <DialogFooter>
              <Button onClick={confirm} disabled={saving} className="w-full">
                {saving ? "Agendando..." : "Confirmar cita"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
