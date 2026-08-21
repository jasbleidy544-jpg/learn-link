import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Heart } from "lucide-react";

type Pregunta = {
  enunciado: string;
  opciones: string[];
  respuesta_correcta: number;
  explicacion: string;
  concepto?: string;
};

const OPEN_QUESTIONS = [
  {
    key: "relacion",
    label: "¿Cómo te llevas con esta materia?",
    placeholder: "Ejemplo: Me parece aburrida, no entiendo casi nada, o me gusta pero me cuesta...",
  },
  {
    key: "gustos",
    label: "¿Hay algún tema de esta materia que sí entiendes o te llama la atención?",
    placeholder: "Ejemplo: Me gustan las sumas pero las fracciones no las entiendo...",
  },
  {
    key: "ultima_vez",
    label: "¿Cuándo fue la última vez que estudiaste algo de esta materia?",
    placeholder: "Ejemplo: Hace una semana, el año pasado, casi nunca estudio...",
  },
  {
    key: "necesita",
    label: "¿Qué crees que necesitas para mejorar en esta materia?",
    placeholder: "Ejemplo: Que me expliquen más despacio, ejemplos del diario, practicar más...",
  },
  {
    key: "vida_diaria",
    label: "¿Hay algo de tu vida diaria que se relacione con esta materia?",
    placeholder: "Ejemplo: Cuando voy a la tienda uso las matemáticas, cuando cocino uso química...",
  },
];

export default function DiagnosticWizard({
  subject, defaultGrade, onComplete,
}: { subject: string; defaultGrade?: string | null; onComplete: () => void }) {
  const [step, setStep] = useState<"form" | "loading-q" | "exercises" | "analyzing">("form");
  const [grade, setGrade] = useState(defaultGrade || "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [respuestas, setRespuestas] = useState<number[]>([]);

  const startExercises = async () => {
    if (!grade.trim()) { toast.error("Cuéntanos tu grado"); return; }
    setStep("loading-q");
    try {
      const { data, error } = await supabase.functions.invoke("subject-diagnostic-questions", {
        body: { subject, grade },
      });
      if (error) throw error;
      const qs: Pregunta[] = data?.preguntas || [];
      if (!qs.length) throw new Error("No se generaron preguntas");
      setPreguntas(qs);
      setRespuestas(new Array(qs.length).fill(-1));
      setStep("exercises");
    } catch (e: any) {
      toast.error(e?.message || "Error generando preguntas");
      setStep("form");
    }
  };

  const submit = async () => {
    if (respuestas.some((r) => r < 0)) { toast.error("Responde todas las preguntas (puedes elegir 'No estoy seguro/a')"); return; }
    setStep("analyzing");
    try {
      const cuestionario = { grado: grade, ...answers };
      const ejercicios = preguntas.map((p, i) => ({
        enunciado: p.enunciado,
        opciones: p.opciones,
        respuesta_estudiante: p.opciones[respuestas[i]],
        respuesta_correcta: p.opciones[p.respuesta_correcta],
        acertada: respuestas[i] === p.respuesta_correcta,
      }));
      const { data, error } = await supabase.functions.invoke("subject-diagnostic-analyze", {
        body: { subject, grade, cuestionario, ejercicios },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("¡Diagnóstico completado!");
      onComplete();
    } catch (e: any) {
      toast.error(e?.message || "Error analizando diagnóstico");
      setStep("exercises");
    }
  };

  if (step === "form") {
    return (
      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" /> Cuéntanos sobre ti y {subject}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tranqui, no hay respuestas malas. Es solo para conocerte mejor 💜
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>¿En qué grado estás?</Label>
            <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Ejemplo: 9°, 10°, 11°..." />
          </div>
          {OPEN_QUESTIONS.map((q) => (
            <div key={q.key}>
              <Label>{q.label}</Label>
              <Textarea
                value={answers[q.key] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                placeholder={q.placeholder}
                rows={3}
                className="mt-1"
              />
            </div>
          ))}
          <Button onClick={startExercises} className="w-full" size="lg">
            Continuar con unos ejercicios fáciles ✨
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "loading-q" || step === "analyzing") {
    return (
      <Card className="cloud-card">
        <CardContent className="py-16 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-center">
            {step === "loading-q"
              ? "Preparando preguntas cortas y fáciles..."
              : "Analizando todo y armando tu camino personalizado..."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cloud-card">
      <CardHeader>
        <CardTitle>Ejercicios cortos — {subject}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Responde con calma. Si no sabes, elige <strong>"No estoy seguro/a"</strong>, no pasa nada.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {preguntas.map((p, i) => (
          <div key={i} className="space-y-2">
            <p className="font-medium">{i + 1}. {p.enunciado}</p>
            <div className="grid gap-2">
              {p.opciones.map((op, j) => (
                <button
                  key={j}
                  onClick={() => {
                    const copy = [...respuestas]; copy[i] = j; setRespuestas(copy);
                  }}
                  className={`text-left p-3 rounded-lg border transition ${
                    respuestas[i] === j
                      ? "border-primary bg-primary/15"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  {String.fromCharCode(65 + j)}. {op}
                </button>
              ))}
            </div>
          </div>
        ))}
        <Button onClick={submit} className="w-full" size="lg">Enviar mis respuestas</Button>
      </CardContent>
    </Card>
  );
}