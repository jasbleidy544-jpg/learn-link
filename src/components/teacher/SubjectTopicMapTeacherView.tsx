import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";

export type TopicResult = { tema: string; porcentaje: number; estado: "Dominado" | "En desarrollo" | "Reforzar" };

const ESTADO_STYLE: Record<TopicResult["estado"], { bar: string; badge: string; label: string }> = {
  "Dominado": { bar: "bg-green-500", badge: "text-green-400 bg-green-500/10 border-green-500/30", label: "🟢 Dominado" },
  "En desarrollo": { bar: "bg-yellow-500", badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", label: "🟡 En desarrollo" },
  "Reforzar": { bar: "bg-red-500", badge: "text-red-400 bg-red-500/10 border-red-500/30", label: "🔴 Reforzar" },
};

/** Vista del mapa de competencias para el docente, con acción de "validar dominio" por tema. */
export default function SubjectTopicMap({
  topicResults, recomendacionIa, onValidar,
}: {
  topicResults: TopicResult[];
  recomendacionIa: string | null;
  onValidar: (tema: string) => void;
}) {
  return (
    <Card className="cloud-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4 text-primary" /> Resultados por competencia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topicResults.map((t, i) => {
          const style = ESTADO_STYLE[t.estado] || ESTADO_STYLE["En desarrollo"];
          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{t.tema}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t.porcentaje}%</span>
                  {t.estado !== "Dominado" && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => onValidar(t.tema)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Validar
                    </Button>
                  )}
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
                <div className={`h-full ${style.bar}`} style={{ width: `${Math.max(4, t.porcentaje)}%` }} />
              </div>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${style.badge}`}>{style.label}</span>
            </div>
          );
        })}
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
