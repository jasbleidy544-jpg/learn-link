import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen, MessageSquarePlus, RefreshCcw, History, Sparkles } from "lucide-react";
import { toast } from "sonner";
import CreateActivityDialog from "@/components/teacher/CreateActivityDialog";
import SubjectTopicMap, { type TopicResult } from "./SubjectTopicMapTeacherView";

const SUBJECTS = [
  "Matemáticas", "Lenguaje", "Castellano", "Ciencias", "Biología",
  "Física", "Química", "Sociales", "Inglés", "Filosofía", "Arte", "Religión",
];

type Student = { id: string; full_name: string };
type Journey = {
  id: string;
  nivel: string | null;
  perfil: string | null;
  mensaje_motivacional: string | null;
  topic_results: TopicResult[];
  diagnostico_inicial_pct: number | null;
  ultima_evaluacion_pct: number | null;
  recomendacion_ia: string | null;
  updated_at?: string;
};
type DiagHistory = { id: string; overall_pct: number | null; created_at: string };
type TeacherAction = {
  id: string; tipo: string; tema: string | null; contenido: string | null;
  resuelto: boolean; created_at: string;
};

export default function SubjectTeacherPanel() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string>("");
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [loadingJourney, setLoadingJourney] = useState(false);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [history, setHistory] = useState<DiagHistory[]>([]);
  const [actions, setActions] = useState<TeacherAction[]>([]);
  const [observacion, setObservacion] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingStudents(true);
      const { data } = await (supabase as any)
        .from("asignaciones")
        .select("estudiante_id, profiles!asignaciones_estudiante_id_fkey(id, full_name)")
        .eq("docente_id", user.id);
      const list: Student[] = (data || []).map((r: any) => r.profiles).filter(Boolean);
      setStudents(list);
      if (list.length && !studentId) setStudentId(list[0].id);
      setLoadingStudents(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const selectedStudent = useMemo(() => students.find((s) => s.id === studentId) || null, [students, studentId]);

  const loadSubjectData = async () => {
    if (!studentId || !subject) return;
    setLoadingJourney(true);
    const [{ data: j }, { data: h }, { data: a }] = await Promise.all([
      (supabase as any).from("subject_journeys").select("*").eq("user_id", studentId).eq("subject", subject).maybeSingle(),
      (supabase as any).from("subject_diagnostics").select("id, overall_pct, created_at").eq("user_id", studentId).eq("subject", subject).order("created_at", { ascending: true }),
      (supabase as any).from("subject_teacher_actions").select("*").eq("student_id", studentId).eq("subject", subject).order("created_at", { ascending: false }),
    ]);
    setJourney(j || null);
    setHistory(h || []);
    setActions(a || []);
    setLoadingJourney(false);
  };

  useEffect(() => { loadSubjectData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [studentId, subject]);

  const addObservacion = async () => {
    if (!user || !studentId || !observacion.trim()) return;
    setSaving(true);
    const { error } = await (supabase as any).from("subject_teacher_actions").insert({
      teacher_id: user.id, student_id: studentId, subject, tipo: "observacion", contenido: observacion.trim(),
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Observación guardada");
    setObservacion("");
    loadSubjectData();
  };

  const solicitarReevaluacion = async () => {
    if (!user || !studentId) return;
    setSaving(true);
    const { error } = await (supabase as any).from("subject_teacher_actions").insert({
      teacher_id: user.id, student_id: studentId, subject, tipo: "solicitud_reevaluacion",
      contenido: "Tu docente te pidió repetir el diagnóstico de esta materia.",
    });
    if (!error) {
      await (supabase as any).from("student_notifications").insert({
        student_id: studentId,
        type: "diagnostico",
        title: `📋 Nueva evaluación de ${subject}`,
        content: "Tu docente te pidió repetir el diagnóstico de esta materia para revisar tu avance.",
      });
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Solicitud enviada al estudiante");
    loadSubjectData();
  };

  const validarDominio = async (tema: string) => {
    if (!user || !studentId) return;
    const { error } = await (supabase as any).from("subject_teacher_actions").insert({
      teacher_id: user.id, student_id: studentId, subject, tipo: "validacion", tema,
      contenido: `El docente validó el dominio de "${tema}" con evidencia adicional en clase.`,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Dominio de "${tema}" validado`);
    loadSubjectData();
  };

  const actionLabel = (tipo: string) => ({
    observacion: "📝 Observación",
    actividad_asignada: "📚 Actividad asignada",
    solicitud_reevaluacion: "🔄 Reevaluación solicitada",
    validacion: "✅ Dominio validado",
  } as Record<string, string>)[tipo] || tipo;

  return (
    <div className="space-y-6">
      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Seguimiento por asignatura
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Consulta el diagnóstico de IA por materia y por tema, y acompaña el proceso de tus estudiantes.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Estudiante</label>
            <Select value={studentId} onValueChange={setStudentId} disabled={loadingStudents || students.length === 0}>
              <SelectTrigger><SelectValue placeholder="Selecciona un estudiante" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[180px]">
            <label className="text-xs text-muted-foreground mb-1 block">Materia</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loadingStudents ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : students.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No tienes estudiantes asignados todavía.</p>
      ) : loadingJourney ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !journey ? (
        <Card className="cloud-card">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {selectedStudent?.full_name || "Este estudiante"} aún no ha hecho el diagnóstico de {subject}.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="cloud-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-primary" /> Perfil de IA — {subject}
                {journey.nivel && <Badge variant="outline">{journey.nivel}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {journey.perfil && <p className="text-sm">{journey.perfil}</p>}
              <div className="flex flex-wrap gap-4 text-sm">
                {journey.diagnostico_inicial_pct != null && (
                  <span className="text-muted-foreground">Diagnóstico inicial: <strong className="text-foreground">{journey.diagnostico_inicial_pct}%</strong></span>
                )}
                {journey.ultima_evaluacion_pct != null && (
                  <span className="text-muted-foreground">Última evaluación: <strong className="text-primary">{journey.ultima_evaluacion_pct}%</strong></span>
                )}
              </div>
            </CardContent>
          </Card>

          {journey.topic_results && journey.topic_results.length > 0 && (
            <SubjectTopicMap
              topicResults={journey.topic_results}
              recomendacionIa={journey.recomendacion_ia || null}
              onValidar={validarDominio}
            />
          )}

          <Card className="cloud-card">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" /> Historial de evolución</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay diagnósticos registrados.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <div key={h.id} className="px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs">
                      {new Date(h.created_at).toLocaleDateString("es-CO")}: <strong>{h.overall_pct ?? "—"}%</strong>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="cloud-card">
            <CardHeader><CardTitle className="text-base">Acciones del docente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <CreateActivityDialog
                  key={`${studentId}-${subject}`}
                  lockedStudent={selectedStudent ? { id: selectedStudent.id, full_name: selectedStudent.full_name } : undefined}
                  initialMateria={subject}
                  initialTema={journey.topic_results?.find((t) => t.estado === "Reforzar")?.tema || ""}
                  trigger={
                    <Button size="sm" variant="outline">
                      <BookOpen className="w-4 h-4 mr-1" /> Asignar actividad de refuerzo
                    </Button>
                  }
                />
                <Button size="sm" variant="outline" onClick={solicitarReevaluacion} disabled={saving}>
                  <RefreshCcw className="w-4 h-4 mr-1" /> Solicitar reevaluación
                </Button>
              </div>

              <div className="space-y-2">
                <Textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Observación pedagógica sobre lo que has visto en clase..."
                  rows={2}
                />
                <Button size="sm" onClick={addObservacion} disabled={saving || !observacion.trim()}>
                  <MessageSquarePlus className="w-4 h-4 mr-1" /> Agregar observación
                </Button>
              </div>

              {actions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Historial de seguimiento</p>
                  {actions.map((a) => (
                    <div key={a.id} className="text-sm p-2 rounded-lg bg-muted/20 border border-border/40">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-xs">{actionLabel(a.tipo)}{a.tema ? ` · ${a.tema}` : ""}</span>
                        <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("es-CO")}</span>
                      </div>
                      {a.contenido && <p className="text-xs text-muted-foreground mt-1">{a.contenido}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
