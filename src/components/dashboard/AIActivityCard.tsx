import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Loader2, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdaptiveQuizDialog from "./AdaptiveQuizDialog";
import CompletedAIActivitiesDialog from "./CompletedAIActivitiesDialog";

// Mismo catálogo de materias que usan los docentes al crear actividades
// (CreateActivityDialog) para que la IA cubra exactamente el mismo
// abanico de asignaturas, no solo matemáticas.
const ALL_AREAS = [
  "matemáticas", "física", "castellano", "química",
  "arte", "religión", "filosofía", "inglés",
];

const LABEL: Record<string, string> = {
  "matemáticas": "Matemáticas", "física": "Física", "castellano": "Castellano",
  "química": "Química", "arte": "Arte", "religión": "Religión",
  "filosofía": "Filosofía", "inglés": "Inglés",
};

const LAST_AREA_KEY = "learnlink:last-ai-area";

function matchArea(text: string): string | null {
  const t = (text || "").toLowerCase();
  return ALL_AREAS.find((a) => t.includes(a)) || null;
}

export default function AIActivityCard() {
  const { user } = useAuth();
  const [area, setArea] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const decide = async () => {
    if (!user) return;
    setLoading(true);

    const scores: Record<string, { sum: number; n: number }> = {};
    ALL_AREAS.forEach((a) => (scores[a] = { sum: 0, n: 0 }));

    // 1) Diagnóstico empático más reciente: áreas marcadas como de riesgo
    const { data: diag } = await (supabase as any)
      .from("diagnosticos")
      .select("resultado")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const areasRiesgo: unknown[] = diag?.resultado?.areas_riesgo ?? [];
    areasRiesgo.forEach((raw) => {
      const m = matchArea(String(raw));
      if (m) { scores[m].sum += 35; scores[m].n += 1; }
    });

    // 2) Actividades que le han enviado SUS DOCENTES (todas las materias,
    //    no solo matemáticas) — antes esta señal no se tenía en cuenta.
    const { data: asignadas } = await (supabase as any)
      .from("actividades_estudiantes")
      .select("completada, puntaje, actividades (materia)")
      .eq("estudiante_id", user.id);
    (asignadas || []).forEach((r: any) => {
      const m = matchArea(r.actividades?.materia || "");
      if (m && r.completada && typeof r.puntaje === "number") {
        scores[m].sum += r.puntaje; scores[m].n += 1;
      }
    });

    // 3) Historial de retos propios generados por la IA
    const { data: acts } = await (supabase as any)
      .from("student_activities").select("area,score,status")
      .eq("student_id", user.id).order("created_at", { ascending: false }).limit(40);
    (acts || []).forEach((a: any) => {
      const m = matchArea(a.area || "");
      if (m && a.status === "completed" && typeof a.score === "number") {
        scores[m].sum += a.score; scores[m].n += 1;
      }
    });

    // Promedio por materia. Sin datos propios, todas parten parejas (70) para
    // que la selección no se incline siempre hacia la primera del listado.
    const withAvg = ALL_AREAS.map((a) => ({
      area: a,
      avg: scores[a].n > 0 ? scores[a].sum / scores[a].n : 70,
      hasData: scores[a].n > 0,
    }));

    const minAvg = Math.min(...withAvg.map((x) => x.avg));
    let weakest = withAvg.filter((x) => x.avg <= minAvg + 0.01).map((x) => x.area);

    // Si hay empate entre varias materias, evita repetir exactamente la
    // misma del reto anterior para que el estudiante rote entre asignaturas.
    let lastArea: string | null = null;
    try { lastArea = localStorage.getItem(LAST_AREA_KEY); } catch { /* ignore */ }
    if (weakest.length > 1 && lastArea) {
      const alt = weakest.filter((a) => a !== lastArea);
      if (alt.length) weakest = alt;
    }

    const pick = weakest[Math.floor(Math.random() * weakest.length)] ?? ALL_AREAS[0];
    try { localStorage.setItem(LAST_AREA_KEY, pick); } catch { /* ignore */ }

    const pickedInfo = withAvg.find((x) => x.area === pick);
    setArea(pick);
    setReason(
      pickedInfo?.hasData && pickedInfo.avg < 60
        ? "Detecté que esta materia es la que más necesita refuerzo según tu historial."
        : "Vamos a practicar esta materia para mantener tu progreso en todas tus asignaturas."
    );
    setLoading(false);
  };

  useEffect(() => { decide(); }, [user]);

  useEffect(() => {
    const handler = () => decide();
    window.addEventListener("learnlink:activity-completed", handler);
    return () => window.removeEventListener("learnlink:activity-completed", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const label = area ? LABEL[area] ?? area : "...";

  return (
    <Card className="cloud-card animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {loading ? "La IA está eligiendo tu materia..." : `Actividad de ${label}`}
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">Seleccionada por la IA</span>
          <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)}>
            <History className="w-4 h-4 mr-1" /> Ver completadas
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Analizando tu progreso...
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{reason}</p>
            <p className="text-sm">
              La IA generará preguntas tipo ICFES de <strong>{label}</strong>, mostrará la respuesta correcta con
              explicación cuando falles y sumarás hasta <strong>100 puntos</strong> por sesión.
            </p>
            <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
              <Play className="w-4 h-4 mr-1" /> Iniciar actividad
            </Button>
          </>
        )}
      </CardContent>
      <AdaptiveQuizDialog
        open={open}
        onOpenChange={setOpen}
        area={area ?? undefined}
        count="auto"
      />
      <CompletedAIActivitiesDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </Card>
  );
}
