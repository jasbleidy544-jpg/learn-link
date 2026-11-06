import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FileText, CheckCircle, AlertTriangle, Sparkles, Loader2 } from "lucide-react";

type Resultado = {
  resumen_para_docente?: string;
  areas_fortaleza?: string[];
  areas_riesgo?: string[];
  etiquetas?: string[];
};

export default function SummaryTab({ studentId }: { studentId: string }) {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("diagnosticos")
        .select("resultado, completed_at")
        .eq("user_id", studentId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setResultado(data?.resultado ?? null);
      setFecha(data?.completed_at ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando resumen…
      </div>
    );
  }

  if (!resultado) {
    return (
      <Card className="cloud-card">
        <CardContent className="py-10 text-center text-muted-foreground">
          Este estudiante aún no ha completado su diagnóstico inicial. Cuando lo haga, aquí
          aparecerá el resumen y las recomendaciones generadas por la IA.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {resultado.resumen_para_docente && (
        <Card className="cloud-card glow-effect">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Resumen para el docente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{resultado.resumen_para_docente}</p>
            {fecha && (
              <p className="text-xs text-muted-foreground mt-3">
                Diagnóstico del {new Date(fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {Array.isArray(resultado.areas_fortaleza) && resultado.areas_fortaleza.length > 0 && (
          <Card className="cloud-card border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" /> Fortalezas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {resultado.areas_fortaleza.map((a, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {Array.isArray(resultado.areas_riesgo) && resultado.areas_riesgo.length > 0 && (
          <Card className="cloud-card border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" /> Áreas de atención
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {resultado.areas_riesgo.map((a, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {Array.isArray(resultado.etiquetas) && resultado.etiquetas.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Etiquetas del estudiante
          </p>
          <div className="flex flex-wrap gap-2">
            {resultado.etiquetas.map((t, i) => (
              <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
