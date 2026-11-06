import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

type ScorePoint = {
  fecha: string;
  materia: string;
  puntaje: number;
  origen: "Tarea del docente" | "Autoaprendizaje IA";
};

const LOW_THRESHOLD = 60;

export default function ProgressTab({ studentId }: { studentId: string }) {
  const [points, setPoints] = useState<ScorePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const [{ data: asignadas }, { data: autoaprendizaje }] = await Promise.all([
        (supabase as any)
          .from("actividades_estudiantes")
          .select("puntaje, fecha_realizacion, completada, actividades(materia)")
          .eq("estudiante_id", studentId)
          .eq("completada", true)
          .not("puntaje", "is", null),
        (supabase as any)
          .from("student_activities")
          .select("score, completed_at, area, status")
          .eq("student_id", studentId)
          .eq("status", "completed")
          .not("score", "is", null),
      ]);

      if (cancelled) return;

      const fromAsignadas: ScorePoint[] = (asignadas || [])
        .filter((r: any) => r.fecha_realizacion)
        .map((r: any) => ({
          fecha: r.fecha_realizacion,
          materia: r.actividades?.materia || "Sin materia",
          puntaje: Number(r.puntaje),
          origen: "Tarea del docente" as const,
        }));

      const fromAuto: ScorePoint[] = (autoaprendizaje || [])
        .filter((r: any) => r.completed_at)
        .map((r: any) => ({
          fecha: r.completed_at,
          materia: r.area || "Sin materia",
          puntaje: Number(r.score),
          origen: "Autoaprendizaje IA" as const,
        }));

      const all = [...fromAsignadas, ...fromAuto].sort(
        (a, b) => +new Date(a.fecha) - +new Date(b.fecha)
      );

      setPoints(all);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const last10 = useMemo(() => points.slice(-10), [points]);

  const chartData = useMemo(
    () =>
      last10.map((p, i) => ({
        name: new Date(p.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
        puntaje: p.puntaje,
        materia: p.materia,
        key: `${p.fecha}-${i}`,
      })),
    [last10]
  );

  const bySubject = useMemo(() => {
    const buckets: Record<string, number[]> = {};
    points.forEach((p) => { (buckets[p.materia] ||= []).push(p.puntaje); });
    return Object.entries(buckets)
      .map(([materia, scores]) => ({
        materia,
        promedio: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length,
      }))
      .sort((a, b) => a.promedio - b.promedio);
  }, [points]);

  const weakSubjects = bySubject.filter((s) => s.promedio < LOW_THRESHOLD);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando progreso académico…
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <Card className="cloud-card">
        <CardContent className="py-10 text-center text-muted-foreground">
          Este estudiante aún no tiene actividades completadas con puntaje, ni de tareas
          enviadas por docentes ni de autoaprendizaje con la IA.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {weakSubjects.length > 0 && (
        <Card className="cloud-card border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-red-300">Materias que necesitan refuerzo: </span>
                {weakSubjects.map((s) => `${s.materia} (${s.promedio.toFixed(0)} pts)`).join(", ")}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="cloud-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Últimos {last10.length} puntajes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number, _name, item: any) => [`${value} pts`, item.payload.materia]}
                />
                <Bar dataKey="puntaje" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.puntaje < LOW_THRESHOLD ? "hsl(0 72% 51%)" : "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="cloud-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Promedio por materia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {bySubject.map((s) => (
            <div key={s.materia} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
              <div>
                <span className="font-medium text-sm">{s.materia}</span>
                <span className="text-xs text-muted-foreground ml-2">{s.count} actividad(es)</span>
              </div>
              <Badge
                variant="outline"
                className={
                  s.promedio < LOW_THRESHOLD
                    ? "bg-red-500/15 text-red-300 border-red-500/40"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                }
              >
                {s.promedio.toFixed(0)} pts
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
