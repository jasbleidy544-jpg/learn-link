import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdaptiveQuizDialog from "./AdaptiveQuizDialog";

const ALL_AREAS = [
  "matemáticas", "física", "química", "biología", "ciencias",
  "castellano", "lenguaje", "inglés", "sociales",
  "filosofía", "religión", "arte",
];

const LABEL: Record<string, string> = {
  "matemáticas": "Matemáticas", "física": "Física", "química": "Química",
  "biología": "Biología", "ciencias": "Ciencias", "castellano": "Castellano",
  "lenguaje": "Lenguaje", "inglés": "Inglés", "sociales": "Sociales",
  "filosofía": "Filosofía", "religión": "Religión", "arte": "Arte",
};

function matchArea(text: string): string | null {
  const t = (text || "").toLowerCase();
  return ALL_AREAS.find((a) => t.includes(a)) || null;
}

export default function AIActivityCard() {
  const { user } = useAuth();
  const [area, setArea] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const decide = async () => {
    if (!user) return;
    setLoading(true);
    const scores: Record<string, { sum: number; n: number }> = {};
    ALL_AREAS.forEach((a) => (scores[a] = { sum: 60, n: 1 }));

    // Diagnostic snapshot
    const { data: diag } = await (supabase as any)
      .from("diagnostic_results").select("results").eq("student_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (diag?.results && typeof diag.results === "object") {
      for (const [k, v] of Object.entries(diag.results as Record<string, any>)) {
        const m = matchArea(k);
        if (m && typeof v === "number") { scores[m].sum += v; scores[m].n += 1; }
      }
    }
    // History of activities (own + teacher-assigned)
    const { data: acts } = await (supabase as any)
      .from("student_activities").select("area,score,status,title")
      .eq("student_id", user.id).order("created_at", { ascending: false }).limit(40);
    (acts || []).forEach((a: any) => {
      const m = matchArea(`${a.area || ""} ${a.title || ""}`);
      if (m && a.status === "completed" && typeof a.score === "number") {
        scores[m].sum += a.score; scores[m].n += 1;
      }
    });

    // Pick weakest area with the most signal; tie-break by lowest avg.
    let pick = "matemáticas";
    let best = Infinity;
    Object.entries(scores).forEach(([k, v]) => {
      const avg = v.sum / v.n;
      if (avg < best) { best = avg; pick = k; }
    });
    setArea(pick);
    setReason(
      best < 60
        ? "Detecté que esta materia es la que más necesita refuerzo según tu historial."
        : "Listo para subir el nivel: trabajemos esta materia para mantener tu progreso."
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {loading ? "La IA está eligiendo tu materia..." : `Actividad de ${label}`}
        </CardTitle>
        <span className="text-xs text-muted-foreground hidden sm:inline">Seleccionada por la IA</span>
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
    </Card>
  );
}