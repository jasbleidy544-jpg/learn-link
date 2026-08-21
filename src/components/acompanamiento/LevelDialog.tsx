import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Activity = {
  tipo?: string;
  contenido: string;
  opciones?: string[];
  respuesta_correcta?: number;
  explicacion?: string;
  concepto?: string;
};
export type Level = {
  nombre: string;
  descripcion: string;
  dificultad?: string;
  actividades: Activity[];
};

type CoachingState = {
  explicacion: string;
  ejemplo: string;
  nuevaPregunta?: Activity;
  intento: number;
  conceptoOk: boolean | null;
};

const PASS_THRESHOLD = 0.7;

export default function LevelDialog({
  open, onOpenChange, level, levelIndex, subject, userId, nextLevelName, onCompleted, onProgress,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  level: Level | null;
  levelIndex: number;
  subject: string;
  userId: string;
  nextLevelName?: string;
  onCompleted: (passed: boolean, levelName: string, mensaje: string) => void;
  onProgress?: (pct: number) => void;
}) {
  const [qIndex, setQIndex] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [failedConcepts, setFailedConcepts] = useState<string[]>([]);
  const [coach, setCoach] = useState<CoachingState | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachAnswer, setCoachAnswer] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setQIndex(0); setAciertos(0); setFailedConcepts([]);
      setCoach(null); setCoachAnswer(null); setFinished(false);
    }
  }, [open, level]);

  useEffect(() => {
    if (!level) return;
    const pct = (qIndex / level.actividades.length) * 100;
    onProgress?.(pct);
  }, [qIndex, level, onProgress]);

  if (!level) return null;
  const total = level.actividades.length;
  const current = level.actividades[qIndex];

  const triggerCoaching = async (q: Activity, chosen: number) => {
    setCoachLoading(true);
    setCoach({ explicacion: "", ejemplo: "", intento: 1, conceptoOk: null });
    try {
      const { data, error } = await supabase.functions.invoke("subject-error-coaching", {
        body: {
          subject,
          pregunta: q.contenido,
          opcionElegida: q.opciones?.[chosen] || "—",
          respuestaCorrecta: q.opciones?.[q.respuesta_correcta ?? 0] || "—",
          concepto: q.concepto || "general",
          intento: 1,
        },
      });
      if (error) throw error;
      setCoach({
        explicacion: data?.explicacion || "¡Tranqui! Veamos esto juntos.",
        ejemplo: data?.ejemplo || "",
        nuevaPregunta: data?.nuevaPregunta,
        intento: 1,
        conceptoOk: null,
      });
      setCoachAnswer(null);
    } catch (e: any) {
      toast.error("No pudimos generar la ayuda. Sigamos adelante.");
      setCoach(null);
    } finally {
      setCoachLoading(false);
    }
  };

  const requestAnotherCoaching = async () => {
    if (!current || !coach) return;
    setCoachLoading(true);
    try {
      const { data } = await supabase.functions.invoke("subject-error-coaching", {
        body: {
          subject,
          pregunta: coach.nuevaPregunta?.contenido || current.contenido,
          opcionElegida: coach.nuevaPregunta?.opciones?.[coachAnswer ?? 0] || "—",
          respuestaCorrecta: coach.nuevaPregunta?.opciones?.[coach.nuevaPregunta?.respuesta_correcta ?? 0] || "—",
          concepto: current.concepto || "general",
          intento: coach.intento + 1,
        },
      });
      setCoach({
        explicacion: data?.explicacion || coach.explicacion,
        ejemplo: data?.ejemplo || coach.ejemplo,
        nuevaPregunta: data?.nuevaPregunta,
        intento: coach.intento + 1,
        conceptoOk: null,
      });
      setCoachAnswer(null);
    } catch {
      toast.error("No pudimos generar otra ayuda.");
    } finally {
      setCoachLoading(false);
    }
  };

  const answer = (chosen: number) => {
    if (!current || !current.opciones) return;
    const correctIdx = current.respuesta_correcta ?? 0;
    if (chosen === correctIdx) {
      setAciertos((a) => a + 1);
      nextQuestion();
    } else {
      // Skip coaching if user picked "No estoy seguro/a" (typically last option) — still coach
      if (current.concepto) setFailedConcepts((f) => [...new Set([...f, current.concepto!])]);
      triggerCoaching(current, chosen);
    }
  };

  const submitCoachAnswer = (chosen: number) => {
    if (!coach?.nuevaPregunta) return;
    setCoachAnswer(chosen);
    const ok = chosen === (coach.nuevaPregunta.respuesta_correcta ?? 0);
    if (ok) {
      setCoach({ ...coach, conceptoOk: true });
    } else if (coach.intento >= 3) {
      // Move on after 3 attempts
      setCoach({ ...coach, conceptoOk: false });
    } else {
      setCoach({ ...coach, conceptoOk: false });
    }
  };

  const continueAfterCoach = () => {
    setCoach(null);
    setCoachAnswer(null);
    nextQuestion();
  };

  const nextQuestion = () => {
    if (qIndex + 1 >= total) {
      finalize();
    } else {
      setQIndex(qIndex + 1);
    }
  };

  const finalize = async () => {
    setFinished(true);
    setSaving(true);
    const passed = aciertos / total >= PASS_THRESHOLD;
    let mensaje = "";
    try {
      await (supabase as any).from("subject_level_progress").upsert(
        {
          user_id: userId, subject, level_index: levelIndex,
          score: { correct: aciertos, total, percent: Math.round((aciertos / total) * 100), failed_concepts: failedConcepts, passed },
        },
        { onConflict: "user_id,subject,level_index" }
      );

      if (passed) {
        await (supabase as any)
          .from("subject_journeys")
          .update({ current_level: levelIndex + 2 })
          .eq("user_id", userId).eq("subject", subject);
        const { data } = await supabase.functions.invoke("subject-level-feedback", {
          body: { subject, levelName: level.nombre, nextLevelName },
        });
        mensaje = data?.mensaje || "¡Excelente trabajo!";
      } else {
        // Regenerate questions for this level based on failed concepts
        try {
          const { data: qData } = await supabase.functions.invoke("subject-diagnostic-questions", {
            body: { subject, grade: "", topics: failedConcepts },
          });
          const nuevas = qData?.preguntas;
          if (Array.isArray(nuevas) && nuevas.length) {
            // Read camino, replace activities for this level, write back
            const { data: j } = await (supabase as any)
              .from("subject_journeys")
              .select("camino")
              .eq("user_id", userId).eq("subject", subject).maybeSingle();
            if (j?.camino && Array.isArray(j.camino) && j.camino[levelIndex]) {
              const newCamino = [...j.camino];
              newCamino[levelIndex] = {
                ...newCamino[levelIndex],
                actividades: nuevas.map((p: any) => ({
                  tipo: "pregunta",
                  contenido: p.enunciado,
                  opciones: p.opciones,
                  respuesta_correcta: p.respuesta_correcta,
                  explicacion: p.explicacion,
                  concepto: p.concepto,
                })),
              };
              await (supabase as any)
                .from("subject_journeys")
                .update({ camino: newCamino })
                .eq("user_id", userId).eq("subject", subject);
            }
          }
        } catch (err) { console.error("regen failed", err); }
      }
    } catch (e: any) {
      toast.error(e?.message || "Error guardando progreso");
    } finally {
      // Log interaction + trigger AI risk recompute (best-effort, no blocking UI)
      try {
        await (supabase as any).from("platform_interactions").insert({
          user_id: userId,
          interaction_type: passed ? "level_completed" : "level_abandoned",
          metadata: { subject, level_index: levelIndex, correct: aciertos, total },
        });
        supabase.functions.invoke("compute-dropout-risk", { body: { user_id: userId } });
      } catch (err) { console.warn("risk trigger skipped", err); }
      setSaving(false);
      onCompleted(passed, level.nombre, mensaje);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onOpenChange(false); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {level.nombre}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {level.descripcion} · Pregunta {Math.min(qIndex + 1, total)} de {total}
          </p>
        </DialogHeader>

        {!finished && !coach && current && (
          <div className="space-y-4">
            <p className="font-medium text-lg">{current.contenido}</p>
            <div className="grid gap-2">
              {current.opciones?.map((op, j) => (
                <button
                  key={j}
                  onClick={() => answer(j)}
                  className="text-left p-3 rounded-lg border border-border hover:bg-primary/10 hover:border-primary/50 transition"
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + j)}.</span>{op}
                </button>
              ))}
            </div>
          </div>
        )}

        {coach && (
          <div className="space-y-4">
            {coachLoading && !coach.explicacion ? (
              <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" /> Buscando una forma más fácil de explicártelo...
              </div>
            ) : (
              <>
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/10 space-y-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Heart className="w-4 h-4" /> ¡Tranqui! Vamos a entenderlo juntos
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{coach.explicacion}</p>
                  {coach.ejemplo && (
                    <p className="text-sm italic text-muted-foreground">💡 {coach.ejemplo}</p>
                  )}
                </div>

                {coach.nuevaPregunta && coach.conceptoOk === null && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Intento {coach.intento} de 3 · Pregunta parecida más sencilla:</p>
                    <p className="font-medium">{coach.nuevaPregunta.contenido}</p>
                    <div className="grid gap-2">
                      {coach.nuevaPregunta.opciones?.map((op, j) => (
                        <button
                          key={j}
                          onClick={() => submitCoachAnswer(j)}
                          className="text-left p-3 rounded-lg border border-border hover:bg-primary/10 hover:border-primary/50 transition"
                        >
                          <span className="font-semibold mr-2">{String.fromCharCode(65 + j)}.</span>{op}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {coach.conceptoOk === true && (
                  <div className="p-4 rounded-lg border border-green-500/40 bg-green-500/10 space-y-3">
                    <p className="font-semibold text-green-400">¡Lo lograste! Ya entendiste el concepto 🎉</p>
                    <Button onClick={continueAfterCoach} className="w-full">Sigamos</Button>
                  </div>
                )}

                {coach.conceptoOk === false && coach.intento < 3 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">¡Casi! Probemos con otro enfoque.</p>
                    <Button onClick={requestAnotherCoaching} disabled={coachLoading} className="w-full">
                      {coachLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Pensando...</> : "Otro intento"}
                    </Button>
                  </div>
                )}

                {coach.conceptoOk === false && coach.intento >= 3 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      No te preocupes, este tema lo retomaremos más adelante. Sigamos avanzando 💪
                    </p>
                    <Button onClick={continueAfterCoach} className="w-full">Continuar</Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {finished && (
          <div className="space-y-5 text-center py-4">
            {saving ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Guardando tu progreso...</p>
              </>
            ) : (
              <>
                <div className="text-5xl">{aciertos / total >= PASS_THRESHOLD ? "🎉" : "💪"}</div>
                <p className="text-xl font-bold">{aciertos} / {total} correctas</p>
                <p className="text-sm text-muted-foreground">
                  {aciertos / total >= PASS_THRESHOLD
                    ? "¡Dominaste este nivel!"
                    : "Necesitas 70% para avanzar. Te preparamos nuevas preguntas sobre los temas que te costaron."}
                </p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}