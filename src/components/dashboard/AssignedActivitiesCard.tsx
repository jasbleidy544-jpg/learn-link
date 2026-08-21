import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { BookOpen, Loader2, Play, CheckCircle, XCircle, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Row = {
  id: string;
  enviada_en: string;
  actividades: {
    id: string;
    titulo: string;
    materia: string;
    tema: string | null;
    dificultad: "basico" | "intermedio" | "avanzado";
    preguntas: any[];
    docente_nombre: string | null;
    creado_en: string;
  } | null;
};

const DIF_LABEL: Record<string, string> = {
  basico: "🟢 Básico",
  intermedio: "🟡 Intermedio",
  avanzado: "🔴 Avanzado",
};

export default function AssignedActivitiesCard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("actividades_estudiantes")
      .select("id, enviada_en, actividades (id, titulo, materia, tema, dificultad, preguntas, docente_nombre, creado_en)")
      .eq("estudiante_id", user.id)
      .eq("completada", false)
      .order("enviada_en", { ascending: false });
    setRows((data || []).filter((r: Row) => r.actividades));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`ae-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "actividades_estudiantes", filter: `estudiante_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const active = openId ? rows.find(r => r.id === openId) : null;

  return (
    <Card className="cloud-card animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Actividades enviadas por tus docentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no tienes actividades pendientes de tus docentes.</p>
        ) : (
          rows.map((r) => {
            const a = r.actividades!;
            return (
              <div key={r.id} className="border border-border rounded-lg p-3 space-y-2 hover:border-primary/50 transition">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{a.titulo}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-muted-foreground">
                      <span>📚 {a.materia}</span>
                      {a.tema && <span>📝 {a.tema}</span>}
                    </div>
                  </div>
                  <Badge variant="secondary">{DIF_LABEL[a.dificultad] ?? a.dificultad}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  👨‍🏫 {a.docente_nombre || "Docente"} · 📅 {new Date(r.enviada_en).toLocaleDateString()}
                </div>
                <Button size="sm" onClick={() => setOpenId(r.id)}>
                  <Play className="w-4 h-4 mr-1" /> Realizar actividad
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
      {active && active.actividades && (
        <TakeActivityDialog
          assignmentId={active.id}
          titulo={active.actividades.titulo}
          materia={active.actividades.materia}
          questions={active.actividades.preguntas as any[]}
          onClose={() => { setOpenId(null); load(); }}
        />
      )}
    </Card>
  );
}

type Q = { question: string; options: string[]; correct_index: number; explanation: string };

function TakeActivityDialog({ assignmentId, titulo, materia, questions, onClose }: {
  assignmentId: string; titulo: string; materia: string; questions: Q[]; onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const q = questions[current];
  const progress = questions.length ? ((current + (showFeedback ? 1 : 0)) / questions.length) * 100 : 0;

  const submit = () => {
    if (selected === null) return;
    setAnswers((p) => [...p, selected]);
    setShowFeedback(true);
  };

  const next = async () => {
    setShowFeedback(false); setSelected(null);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      const finalAnswers = answers;
      const correct = finalAnswers.filter((a, i) => a === questions[i].correct_index).length;
      const score = Math.round((correct / questions.length) * 100);
      setFinished(true);
      setSaving(true);
      const { error } = await (supabase as any).from("actividades_estudiantes").update({
        completada: true,
        puntaje: score,
        fecha_realizacion: new Date().toISOString(),
        respuestas: finalAnswers,
      }).eq("id", assignmentId);
      setSaving(false);
      if (error) toast.error("No se pudo guardar: " + error.message);
      else toast.success(`¡Actividad completada! Puntaje: ${score}/100`);
    }
  };

  const finalCorrect = answers.filter((a, i) => questions[i] && a === questions[i].correct_index).length;
  const finalScore = questions.length ? Math.round((finalCorrect / questions.length) * 100) : 0;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>Materia: <strong>{materia}</strong></DialogDescription>
        </DialogHeader>

        {!finished && q && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Pregunta {current + 1} de {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <p className="font-medium mb-3">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const isSel = selected === i;
                  const isRight = i === q.correct_index;
                  let cls = "border-input hover:bg-accent/40";
                  if (showFeedback) {
                    if (isRight) cls = "border-green-500 bg-green-500/10";
                    else if (isSel) cls = "border-red-500 bg-red-500/10";
                  } else if (isSel) cls = "border-primary bg-primary/10";
                  return (
                    <button key={i} disabled={showFeedback}
                      onClick={() => setSelected(i)}
                      className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${cls}`}>
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                    </button>
                  );
                })}
              </div>
              {showFeedback && (
                <div className={`mt-3 p-3 rounded-md text-sm ${selected === q.correct_index ? "bg-green-500/10 text-green-700 dark:text-green-300" : "bg-red-500/10 text-red-700 dark:text-red-300"}`}>
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    {selected === q.correct_index ? <><CheckCircle className="w-4 h-4" />¡Correcto!</> : <><XCircle className="w-4 h-4" />Incorrecto</>}
                  </div>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              {!showFeedback ? (
                <Button onClick={submit} disabled={selected === null}>Responder</Button>
              ) : (
                <Button onClick={next}>{current + 1 < questions.length ? "Siguiente" : "Ver resultado"}</Button>
              )}
            </DialogFooter>
          </div>
        )}

        {finished && (
          <div className="py-8 text-center space-y-4">
            <Trophy className="w-12 h-12 mx-auto text-amber-400" />
            <h3 className="text-2xl font-bold">¡Actividad completada!</h3>
            <p className="text-lg">Puntaje: <strong>{finalScore}/100</strong></p>
            <p className="text-sm text-muted-foreground">{finalCorrect} de {questions.length} correctas</p>
            <DialogFooter>
              <Button onClick={onClose} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Guardando...</> : "Cerrar"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}