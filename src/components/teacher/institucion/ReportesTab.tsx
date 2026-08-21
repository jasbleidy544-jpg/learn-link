import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Download, FileText } from "lucide-react";
import { StudentLite } from "./useInstitucionData";

type Fila = {
  id: string;
  nombre: string;
  grado: string | null;
  actividades: number;
  completadas: number;
  promedio: number | null;
  alertas: number;
  remisiones: number;
};

export default function ReportesTab({ students }: { students: StudentLite[] }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Fila[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const ids = students.map((s) => s.id);
    if (ids.length === 0) { setRows([]); setLoading(false); return; }
    const [actRes, alertRes, remRes] = await Promise.all([
      (supabase as any).from("actividades_estudiantes").select("estudiante_id, completada, puntaje").in("estudiante_id", ids),
      (supabase as any).from("alertas_tempranas").select("estudiante_id").eq("docente_id", user.id),
      (supabase as any).from("remisiones").select("estudiante_id").eq("docente_id", user.id),
    ]);
    const acts = (actRes.data || []) as any[];
    const alerts = (alertRes.data || []) as any[];
    const rems = (remRes.data || []) as any[];
    setRows(students.map((s) => {
      const mine = acts.filter((a) => a.estudiante_id === s.id);
      const done = mine.filter((a) => a.completada && a.puntaje != null);
      return {
        id: s.id,
        nombre: s.full_name,
        grado: s.grade,
        actividades: mine.length,
        completadas: done.length,
        promedio: done.length ? Math.round(done.reduce((x, a) => x + Number(a.puntaje), 0) / done.length) : null,
        alertas: alerts.filter((a) => a.estudiante_id === s.id).length,
        remisiones: rems.filter((r) => r.estudiante_id === s.id).length,
      };
    }));
    setLoading(false);
  }, [user, students]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const header = ["Estudiante", "Grado", "Actividades", "Completadas", "Promedio", "Alertas", "Remisiones"];
    const lines = rows.map((r) =>
      [r.nombre, r.grado || "", r.actividades, r.completadas, r.promedio ?? "", r.alertas, r.remisiones].join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte-acompanamiento.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="cloud-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-5 h-5 text-primary" /> Reportes de acompañamiento
        </CardTitle>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="w-4 h-4 mr-1" /> Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no tienes estudiantes asignados para reportar.</p>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border/60">
                  <th className="py-2 pr-3">Estudiante</th>
                  <th className="py-2 pr-3">Grado</th>
                  <th className="py-2 pr-3">Actividades</th>
                  <th className="py-2 pr-3">Completadas</th>
                  <th className="py-2 pr-3">Promedio</th>
                  <th className="py-2 pr-3">Alertas</th>
                  <th className="py-2">Remisiones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/30">
                    <td className="py-2 pr-3 font-medium">{r.nombre}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.grado || "—"}</td>
                    <td className="py-2 pr-3">{r.actividades}</td>
                    <td className="py-2 pr-3">{r.completadas}</td>
                    <td className="py-2 pr-3">{r.promedio != null ? `${r.promedio}%` : "—"}</td>
                    <td className="py-2 pr-3"><Badge variant="outline">{r.alertas}</Badge></td>
                    <td className="py-2"><Badge variant="outline">{r.remisiones}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}