import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Eye, AlertTriangle, ClipboardList, TrendingUp } from "lucide-react";
import { StudentLite } from "./useInstitucionData";

const cardCls = "cloud-card text-center p-4";

export default function PanelInstitucionalResumen({ students }: { students: StudentLite[] }) {
  const { user } = useAuth();
  const [enSeguimiento, setEnSeguimiento] = useState(0);
  const [alertasActivas, setAlertasActivas] = useState(0);
  const [casosPendientes, setCasosPendientes] = useState(0);
  const [progreso, setProgreso] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    const [alertasRes, remisionesRes] = await Promise.all([
      (supabase as any).from("alertas_tempranas").select("estado").eq("docente_id", user.id),
      (supabase as any).from("remisiones").select("estado").eq("docente_id", user.id),
    ]);
    const alertas = (alertasRes.data || []) as { estado: string }[];
    setAlertasActivas(alertas.filter((a) => a.estado === "pendiente" || a.estado === "en seguimiento").length);
    setEnSeguimiento(alertas.filter((a) => a.estado === "en seguimiento").length);
    const rem = (remisionesRes.data || []) as { estado: string }[];
    setCasosPendientes(rem.filter((r) => r.estado !== "atendida" && r.estado !== "cerrada").length);

    const ids = students.map((s) => s.id);
    if (ids.length > 0) {
      const { data } = await (supabase as any)
        .from("actividades_estudiantes")
        .select("puntaje, completada")
        .in("estudiante_id", ids);
      const done = (data || []).filter((r: any) => r.completada && r.puntaje != null);
      setProgreso(done.length ? Math.round(done.reduce((a: number, r: any) => a + Number(r.puntaje), 0) / done.length) : 0);
    } else {
      setProgreso(0);
    }
  }, [user, students]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className={cardCls}>
          <Users className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold">{students.length}</div>
          <p className="text-xs text-muted-foreground">Estudiantes asignados</p>
        </Card>
        <Card className={cardCls}>
          <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">{enSeguimiento}</div>
          <p className="text-xs text-muted-foreground">En seguimiento</p>
        </Card>
        <Card className={`${cardCls} border-orange-500/40`}>
          <AlertTriangle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-400">{alertasActivas}</div>
          <p className="text-xs text-muted-foreground">Alertas activas</p>
        </Card>
        <Card className={cardCls}>
          <ClipboardList className="w-6 h-6 text-accent mx-auto mb-2" />
          <div className="text-2xl font-bold">{casosPendientes}</div>
          <p className="text-xs text-muted-foreground">Casos pendientes</p>
        </Card>
      </div>
      <Card className="cloud-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Progreso general de tus estudiantes
          </span>
          <span className="text-sm font-semibold">{progreso}%</span>
        </div>
        <Progress value={progreso} />
        <p className="text-xs text-muted-foreground mt-2">
          Promedio de las actividades completadas por los estudiantes que acompañas.
        </p>
      </Card>
    </div>
  );
}