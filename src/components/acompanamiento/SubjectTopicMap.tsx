import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import type { TopicResult } from "./SubjectPanel";

const ESTADO_STYLE: Record<TopicResult["estado"], { bar: string; badge: string; label: string }> = {
  "Dominado": { bar: "bg-green-500", badge: "text-green-400 bg-green-500/10 border-green-500/30", label: "🟢 Dominio demostrado" },
  "En desarrollo": { bar: "bg-yellow-500", badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", label: "🟡 En desarrollo" },
  "Reforzar": { bar: "bg-red-500", badge: "text-red-400 bg-red-500/10 border-red-500/30", label: "🔴 Necesita refuerzo" },
};

export default function SubjectTopicMap({
  topicResults, diagnosticoInicialPct, ultimaEvaluacionPct, recomendacionIa,
}: {
  topicResults: TopicResult[];
  diagnosticoInicialPct: number | null;
  ultimaEvaluacionPct: number | null;
  recomendacionIa: string | null;
}) {
  return (
    <Card className="cloud-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Tu mapa de competencias
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Esto se calcula a partir de lo que realmente respondiste, no es una nota fija.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {(diagnosticoInicialPct !== null || ultimaEvaluacionPct !== null) && (
          <div className="flex flex-wrap gap-4 text-sm">
            {diagnosticoInicialPct !== null && (
              <div>
                <span className="text-muted-foreground">Diagnóstico inicial: </span>
                <span className="font-semibold">{diagnosticoInicialPct}%</span>
              </div>
            )}
            {ultimaEvaluacionPct !== null && (
              <div>
                <span className="text-muted-foreground">Última evaluación: </span>
                <span className="font-semibold text-primary">{ultimaEvaluacionPct}%</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {topicResults.map((t, i) => {
            const style = ESTADO_STYLE[t.estado] || ESTADO_STYLE["En desarrollo"];
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t.tema}</span>
                  <span className="text-muted-foreground">{t.porcentaje}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={`h-full ${style.bar} transition-all`}
                    style={{ width: `${Math.max(4, t.porcentaje)}%` }}
                  />
                </div>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${style.badge}`}>
                  {style.label}
                </span>
              </div>
            );
          })}
        </div>

        {recomendacionIa && (
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/10">
            <p className="text-xs font-semibold text-primary mb-1">Recomendación de IA</p>
            <p className="text-sm">{recomendacionIa}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
