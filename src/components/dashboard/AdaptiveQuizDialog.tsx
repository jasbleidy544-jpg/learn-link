import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, CheckCircle, XCircle, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { toast } from "sonner";

type Q = { question: string; options: string[]; correct_index: number; explanation: string };

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  area?: string;
  level?: string;
  count?: number | "auto";
  onCompleted?: (info: { score: number; xp: number; area: string }) => void;
}

const AREAS = ["matemáticas", "lenguaje", "ciencias", "biología", "sociales", "física", "química", "inglés", "filosofía", "arte", "religión", "castellano"];

const avoidKey = (area: string) => `learnlink:avoid:${area.toLowerCase()}`;
const getAvoid = (area: string): string[] => {
  try { return JSON.parse(localStorage.getItem(avoidKey(area)) || "[]"); } catch { return []; }
};
const pushAvoid = (area: string, stems: string[]) => {
  const prev = getAvoid(area);
  const merged = [...stems.map((s) => s.slice(0, 120)), ...prev].slice(0, 40);
  try { localStorage.setItem(avoidKey(area), JSON.stringify(merged)); } catch { /* ignore */ }
};

const AdaptiveQuizDialog = ({ open, onOpenChange, area: initialArea, level = "medio", count = "auto", onCompleted }: Props) => {
  const { user } = useAuth();
  const { award } = useGamification();
  const [loading, setLoading] = useState(false);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState(initialArea ?? "matemáticas");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);

  // Pick weakest area from diagnostic results
  const pickArea = async (): Promise<string> => {
    if (initialArea) return initialArea;
    if (!user) return "matemáticas";
    const { data } = await (supabase as any)
      .from("diagnostic_results").select("results").eq("student_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    const r = data?.results;
    if (r && typeof r === "object") {
      const entries = Object.entries(r as Record<string, number>).filter(([_, v]) => typeof v === "number");
      if (entries.length) {
        entries.sort((a, b) => (a[1] as number) - (b[1] as number));
        const lowest = String(entries[0][0]).toLowerCase();
        const match = AREAS.find((a) => lowest.includes(a));
        if (match) return match;
      }
    }
    return AREAS[Math.floor(Math.random() * AREAS.length)];
  };

  const startQuiz = async () => {
    setLoading(true);
    setFinished(false); setCurrent(0); setAnswers([]); setSelected(null); setShowFeedback(false);
    try {
      const chosen = await pickArea();
      setArea(chosen);
      const avoid = getAvoid(chosen);
      const { data, error } = await supabase.functions.invoke("adaptive-question", {
        body: { area: chosen, level, count, avoid },
      });
      if (error) throw error;
      const qs: Q[] = data?.questions ?? [];
      if (!qs.length) throw new Error("La IA no devolvió preguntas");
      const newTitle = data?.title ?? `Reto adaptativo de ${chosen}`;
      setTitle(newTitle); setQuestions(qs);
      pushAvoid(chosen, qs.map((x) => x.question));
      if (user) {
        const { data: act } = await (supabase as any).from("student_activities").insert({
          student_id: user.id, area: chosen, level, title: newTitle, questions: qs, status: "in_progress",
        }).select().maybeSingle();
        if (act) setActivityId(act.id);
      }
    } catch (e: any) {
      const msg = e?.message?.includes("Rate") ? "Demasiadas peticiones, intenta en un momento."
        : e?.message?.includes("Payment") ? "Sin créditos disponibles para la IA."
        : e?.message ?? "No se pudo generar el reto";
      toast.error(msg);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && questions.length === 0 && !loading) startQuiz();
    if (!open) {
      setQuestions([]); setActivityId(null); setFinished(false);
      setCurrent(0); setAnswers([]); setSelected(null); setShowFeedback(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (selected === null || !questions[current]) return;
    const q = questions[current];
    const isCorrect = selected === q.correct_index;
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers);
    setShowFeedback(true);
    if (user && activityId) {
      await (supabase as any).from("activity_responses").insert({
        activity_id: activityId, student_id: user.id,
        question_index: current, selected_index: selected, is_correct: isCorrect,
      });
    }
  };

  const next = async () => {
    setShowFeedback(false); setSelected(null);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      // finalize
      const correct = answers.filter((a, i) => a === questions[i].correct_index).length;
      const score = Math.round((correct / questions.length) * 100);
      const xp = Math.min(100, Math.round(score * 0.6));
      setFinished(true);
      if (user && activityId) {
        await (supabase as any).from("student_activities").update({
          status: "completed", score, xp_earned: xp, completed_at: new Date().toISOString(),
        }).eq("id", activityId);
      }
      if (xp > 0) await award(xp, "researcher", 5);
      toast.success(`+${xp} XP — ¡Reto completado! Puntaje: ${score}/100`);
      onCompleted?.({ score, xp, area });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("learnlink:activity-completed"));
      }
    }
  };

  const q = questions[current];
  const progress = questions.length ? ((current + (showFeedback ? 1 : 0)) / questions.length) * 100 : 0;
  const finalCorrect = answers.filter((a, i) => questions[i] && a === questions[i].correct_index).length;
  const finalScore = questions.length ? Math.round((finalCorrect / questions.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> {title || "Reto adaptativo IA"}
          </DialogTitle>
          <DialogDescription>
            Área: <strong>{area}</strong> · Nivel: <strong>{level}</strong>
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generando preguntas adaptativas...</p>
          </div>
        )}

        {!loading && !finished && q && (
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
            <h3 className="text-2xl font-bold">¡Reto completado!</h3>
            <p className="text-lg">Puntaje: <strong>{finalScore}/100</strong></p>
            <p className="text-sm text-muted-foreground">{finalCorrect} de {questions.length} respuestas correctas</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
              <Button onClick={startQuiz}>Otro reto</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdaptiveQuizDialog;