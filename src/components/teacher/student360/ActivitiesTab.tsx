import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ClipboardList, CheckCircle2, Clock } from "lucide-react";

type Row = {
  id: string;
  completada: boolean;
  puntaje: number | null;
  enviada_en: string;
  fecha_realizacion: string | null;
  titulo: string;
  materia: string;
  tema: string | null;
  dificultad: string;
};

const dificultadLabel = (d: string) =>
  d === "basico" ? "🟢 Básico" : d === "intermedio" ? "🟡 Intermedio" : "🔴 Avanzado";

export default function ActivitiesTab({ studentId, teacherId }: { studentId: string; teacherId?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("actividades_estudiantes")
        .select("id, completada, puntaje, enviada_en, fecha_realizacion, actividades!inner(titulo, materia, tema, dificultad, docente_id)")
        .eq("estudiante_id", studentId)
        .eq("actividades.docente_id", teacherId)
        .order("enviada_en", { ascending: false });
      if (cancelled) return;
      const mapped: Row[] = (data || []).map((r: any) => ({
        id: r.id,
        completada: r.completada,
        puntaje: r.puntaje,
        enviada_en: r.enviada_en,
        fecha_realizacion: r.fecha_realizacion,
        titulo: r.actividades?.titulo || "Actividad",
        materia: r.actividades?.materia || "—",
        tema: r.actividades?.tema || null,
        dificultad: r.actividades?.dificultad || "media",
      }));
      setRows(mapped);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [studentId, teacherId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando actividades…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="cloud-card">
        <CardContent className="py-10 text-center text-muted-foreground">
          Aún no le has enviado actividades a este estudiante. Usa "Asignar nueva tarea" en el
          encabezado para crear la primera.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cloud-card">
      <CardContent className="p-4 space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="p-3 rounded-md bg-muted/30">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <ClipboardList className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm truncate">{r.titulo}</span>
              </div>
              <Badge variant={r.completada ? "secondary" : "outline"} className="gap-1">
                {r.completada ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {r.completada ? `Completada${r.puntaje != null ? ` · ${r.puntaje} pts` : ""}` : "Pendiente"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {r.materia}{r.tema ? ` · ${r.tema}` : ""} · {dificultadLabel(r.dificultad)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Enviada el {new Date(r.enviada_en).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
              {r.fecha_realizacion && ` · Realizada el ${new Date(r.fecha_realizacion).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}`}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
