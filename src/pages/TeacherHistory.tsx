import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";

type Row = {
  id: string;
  titulo: string;
  materia: string;
  tema: string | null;
  dificultad: string;
  creado_en: string;
  actividades_estudiantes: { completada: boolean; puntaje: number | null; estudiante_id: string }[];
};

const dificultadColor = (d: string) =>
  d === "basico" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" :
  d === "intermedio" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" :
  "bg-red-500/20 text-red-300 border-red-500/40";

const dificultadLabel = (d: string) =>
  d === "basico" ? "🟢 Básico" : d === "intermedio" ? "🟡 Intermedio" : "🔴 Avanzado";

type Sort = "fecha" | "nombre" | "mejor" | "mas_completadas" | "menos_completadas";

export default function TeacherHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<Sort>("fecha");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("actividades")
        .select("id, titulo, materia, tema, dificultad, creado_en, actividades_estudiantes(completada, puntaje, estudiante_id)")
        .eq("docente_id", user.id);
      if (error) console.error(error);
      setRows((data as Row[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const enriched = useMemo(() => rows.map(r => {
    const total = r.actividades_estudiantes?.length || 0;
    const completed = r.actividades_estudiantes?.filter(x => x.completada) || [];
    const avg = completed.length ? Math.round(completed.reduce((s, x) => s + (x.puntaje || 0), 0) / completed.length) : 0;
    return { ...r, total, completedCount: completed.length, avg };
  }), [rows]);

  const sorted = useMemo(() => {
    const arr = [...enriched];
    switch (sort) {
      case "nombre": arr.sort((a, b) => a.titulo.localeCompare(b.titulo)); break;
      case "mejor": arr.sort((a, b) => b.avg - a.avg); break;
      case "mas_completadas": arr.sort((a, b) => b.completedCount - a.completedCount); break;
      case "menos_completadas": arr.sort((a, b) => a.completedCount - b.completedCount); break;
      default: arr.sort((a, b) => +new Date(b.creado_en) - +new Date(a.creado_en));
    }
    return arr;
  }, [enriched, sort]);

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Button asChild variant="ghost" size="sm">
              <Link to="/teacher-dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Volver al panel</Link>
            </Button>
            <h1 className="text-2xl font-bold text-gradient">📋 Historial de actividades</h1>
          </div>

          <Card className="cloud-card">
            <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-lg">Mis actividades ({sorted.length})</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ordenar por:</span>
                <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                  <SelectTrigger className="w-[230px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fecha">📅 Fecha (más reciente)</SelectItem>
                    <SelectItem value="nombre">🔤 Nombre (A-Z)</SelectItem>
                    <SelectItem value="mejor">⭐ Mejor calificación promedio</SelectItem>
                    <SelectItem value="mas_completadas">✅ Más completadas</SelectItem>
                    <SelectItem value="menos_completadas">❌ Menos completadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />Cargando...
                </div>
              ) : sorted.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">Aún no has creado actividades.</p>
              ) : (
                <div className="space-y-3">
                  {sorted.map(a => (
                    <Link key={a.id} to={`/teacher-dashboard/historial/${a.id}`}
                      className="block p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/50 transition">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold truncate">{a.titulo}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {a.materia}{a.tema ? ` · ${a.tema}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(a.creado_en).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className={dificultadColor(a.dificultad)}>
                            {dificultadLabel(a.dificultad)}
                          </Badge>
                          <div className="text-xs text-muted-foreground text-right">
                            <div>✅ {a.completedCount} / {a.total} completaron</div>
                            <div>⭐ Promedio: {a.completedCount ? `${a.avg} pts` : "—"}</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}