import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, Users, Video, HeartHandshake, Star } from "lucide-react";

type Meeting = {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  status: string;
  host_id: string;
  host_name?: string;
};

type AssignedTeacher = {
  docente_id: string;
  full_name: string;
  teacher_type: string | null;
};

const statusBadge = (s: string) => {
  if (s === "cancelled") return <Badge variant="destructive">Cancelada</Badge>;
  if (s === "completed") return <Badge variant="secondary">Completada</Badge>;
  if (s === "rescheduled") return <Badge variant="outline">Reprogramada</Badge>;
  return <Badge>Programada</Badge>;
};

export default function MentorshipsTab({ studentId }: { studentId: string }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teachers, setTeachers] = useState<AssignedTeacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const [{ data: meetingRows }, { data: asigRows }] = await Promise.all([
        (supabase as any)
          .from("meetings")
          .select("id, title, description, scheduled_at, status, host_id")
          .eq("student_id", studentId)
          .order("scheduled_at", { ascending: false }),
        (supabase as any)
          .from("asignaciones")
          .select("docente_id")
          .eq("estudiante_id", studentId),
      ]);

      if (cancelled) return;

      const hostIds = Array.from(new Set((meetingRows || []).map((m: any) => m.host_id)));
      const teacherIds = Array.from(new Set((asigRows || []).map((a: any) => a.docente_id)));
      const allIds = Array.from(new Set([...hostIds, ...teacherIds]));

      let namesMap = new Map<string, { full_name: string; teacher_type: string | null }>();
      if (allIds.length > 0) {
        const { data: profs } = await (supabase as any)
          .from("profiles")
          .select("id, full_name, teacher_type")
          .in("id", allIds);
        namesMap = new Map((profs || []).map((p: any) => [p.id, { full_name: p.full_name || "Mentor", teacher_type: p.teacher_type }]));
      }

      setMeetings(
        (meetingRows || []).map((m: any) => ({
          ...m,
          host_name: namesMap.get(m.host_id)?.full_name || "Mentor",
        }))
      );
      setTeachers(
        (asigRows || []).map((a: any) => ({
          docente_id: a.docente_id,
          full_name: namesMap.get(a.docente_id)?.full_name || "Docente",
          teacher_type: namesMap.get(a.docente_id)?.teacher_type || null,
        }))
      );
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando mentorías…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="cloud-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Docentes asignados ({teachers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este estudiante aún no tiene mentores asignados.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teachers.map((t) => (
                <Badge key={t.docente_id} variant="outline" className="gap-1.5 py-1.5 px-3">
                  {t.teacher_type === "retired"
                    ? <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />
                    : <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />}
                  {t.full_name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="cloud-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Historial de reuniones ({meetings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin reuniones registradas todavía.</p>
          ) : (
            meetings.map((m) => {
              const d = new Date(m.scheduled_at);
              return (
                <div key={m.id} className="p-3 rounded-md bg-muted/30">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm truncate">{m.title}</span>
                    </div>
                    {statusBadge(m.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
                    {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · con {m.host_name}
                  </p>
                  {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
