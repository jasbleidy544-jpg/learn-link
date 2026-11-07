import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, History, CheckCircle, XCircle, Trophy, Sparkles } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type Q = { question: string; options: string[]; correct_index: number; explanation: string };

type CompletedRow = {
  id: string;
  area: string;
  title: string | null;
  score: number | null;
  completed_at: string | null;
  questions: Q[] | null;
  respuestas: number[] | null;
};

const COLORS = { correcta: "hsl(142 71% 45%)", incorrecta: "hsl(0 72% 51%)" };

export default function CompletedAIActivitiesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [rows, setRows] = useState<CompletedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("student_activities")
        .select("id, area, title, score, completed_at, questions, respuestas")
        .eq("student_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });
      if (cancelled) return;
      setRows(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Retos de IA completados
          </DialogTitle>
          <DialogDescription>
            Revisa tus puntajes, qué respondiste y la justificación de cada pregunta.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando historial…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Aún no has completado ningún reto generado por la IA.
          </p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {rows.map((r) => {
              const preguntas = Array.isArray(r.questions) ? r.questions : [];
              const respuestas = Array.isArray(r.respuestas) ? r.respuestas : [];
              const correctas = preguntas.filter((q, i) => respuestas[i] === q.correct_index).length;
              const incorrectas = preguntas.length - correctas;
              const chartData = [
                { name: "Correctas", value: correctas },
                { name: "Incorrectas", value: incorrectas },
              ].filter((d) => d.value > 0);

              return (
                <AccordionItem key={r.id} value={r.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-2 gap-2 flex-wrap text-left">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{r.title || "Reto adaptativo"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {r.area}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="gap-1">
                          <Trophy className="w-3 h-3 text-yellow-400" /> {r.score ?? 0}/100
                        </Badge>
                        {r.completed_at && (
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(r.completed_at).toLocaleDateString("es-CO")}
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {preguntas.length > 0 && respuestas.length === preguntas.length ? (
                      <>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={45}
                                outerRadius={75}
                                paddingAngle={2}
                              >
                                {chartData.map((d, i) => (
                                  <Cell
                                    key={i}
                                    fill={d.name === "Correctas" ? COLORS.correcta : COLORS.incorrecta}
                                  />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                              <Legend wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-3">
                          {preguntas.map((q, i) => {
                            const miRespuesta = respuestas[i];
                            const esCorrecta = miRespuesta === q.correct_index;
                            return (
                              <div key={i} className="p-3 rounded-md bg-muted/30 space-y-1.5">
                                <div className="flex items-start gap-2">
                                  {esCorrecta ? (
                                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                  )}
                                  <p className="text-sm font-medium">{i + 1}. {q.question}</p>
                                </div>
                                <p className="text-xs pl-6">
                                  <span className="text-muted-foreground">Tu respuesta: </span>
                                  <span className={esCorrecta ? "text-green-400" : "text-red-400"}>
                                    {q.options?.[miRespuesta] ?? "Sin responder"}
                                  </span>
                                </p>
                                {!esCorrecta && (
                                  <p className="text-xs pl-6">
                                    <span className="text-muted-foreground">Respuesta correcta: </span>
                                    <span className="text-green-400">{q.options?.[q.correct_index]}</span>
                                  </p>
                                )}
                                {q.explanation && (
                                  <p className="text-xs pl-6 text-muted-foreground italic">
                                    💡 {q.explanation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Este reto se completó antes de que guardáramos el detalle de tus
                        respuestas, así que no podemos mostrar el desglose por pregunta.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </DialogContent>
    </Dialog>
  );
}
