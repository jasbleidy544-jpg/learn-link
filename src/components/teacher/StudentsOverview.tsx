import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Zap, Trophy, Users, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import StudentProfileDialog from "./StudentProfileDialog";

type Row = {
  id: string;
  full_name: string;
  grade: string | null;
  xp: number;
  energy: number;
  level_name: string;
  last_activity: string | null;
  avg_grade: number | null;
  risk: "alto" | "medio" | "bajo" | "sin datos";
};

type Props = { scope?: "institution" | "assigned" };

const calcRisk = (avg: number | null, energy: number): Row["risk"] => {
  if (avg == null && energy === 0) return "sin datos";
  const score = (avg ?? 70) * 0.7 + energy * 0.3;
  if (score < 55) return "alto";
  if (score < 72) return "medio";
  return "bajo";
};

const riskBadge = (r: Row["risk"]) => {
  if (r === "alto") return { v: "destructive" as const, icon: <ShieldAlert className="w-3 h-3" />, label: "Riesgo alto" };
  if (r === "medio") return { v: "secondary" as const, icon: <AlertTriangle className="w-3 h-3 text-amber-400" />, label: "Riesgo medio" };
  if (r === "bajo") return { v: "outline" as const, icon: <ShieldCheck className="w-3 h-3 text-emerald-400" />, label: "Riesgo bajo" };
  return { v: "outline" as const, icon: <Users className="w-3 h-3" />, label: "Sin datos" };
};

export default function StudentsOverview({ scope = "institution" }: Props) {
  const { profile, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [assignedCount, setAssignedCount] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      setDebugError(null);
      let students: any[] = [];

      if (scope === "assigned") {
        const { data: asigs, error: aErr } = await (supabase as any)
          .from("asignaciones")
          .select("estudiante_id")
          .eq("docente_id", user.id);
        console.log("[TeacherDashboard] asignaciones:", asigs, aErr);
        if (aErr) {
          setDebugError(`Error consultando asignaciones: ${aErr.message}`);
          setRows([]); setAssignedCount(0); setLoading(false); return;
        }
        const studentIds = (asigs || []).map((a: any) => a.estudiante_id);
        setAssignedCount(studentIds.length);
        if (studentIds.length === 0) { setRows([]); setLoading(false); return; }
        const { data: profs, error: pErr } = await (supabase as any)
          .from("profiles")
          .select("id, full_name, grade, email")
          .in("id", studentIds);
        if (pErr) { setDebugError(`Error perfiles: ${pErr.message}`); setRows([]); setLoading(false); return; }
        students = profs || [];
      } else {
        let q = (supabase as any).from("profiles").select("id, full_name, grade, institution");
        if (profile?.institution) q = q.eq("institution", profile.institution);
        else { setRows([]); setLoading(false); return; }
        const { data, error } = await q;
        if (error) { setDebugError(error.message); setRows([]); setLoading(false); return; }
        students = data || [];
      }

      const ids = students.map((s: any) => s.id).filter((id: string) => id !== user.id);
      if (ids.length === 0) { setRows([]); setLoading(false); return; }

      const [{ data: gam }, { data: grades }] = await Promise.all([
        (supabase as any).from("student_gamification").select("*").in("user_id", ids),
        (supabase as any).from("academic_records").select("student_id, grade_value").in("student_id", ids),
      ]);
      const gmap = new Map((gam || []).map((g: any) => [g.user_id, g]));
      const avgMap = new Map<string, number>();
      const buckets: Record<string, number[]> = {};
      (grades || []).forEach((r: any) => {
        (buckets[r.student_id] ||= []).push(Number(r.grade_value));
      });
      Object.entries(buckets).forEach(([k, arr]) => avgMap.set(k, arr.reduce((a, b) => a + b, 0) / arr.length));

      const merged: Row[] = students
        .filter((s: any) => s.id !== user.id)
        .map((s: any) => {
          const g: any = gmap.get(s.id) || {};
          const energy = g.energy ?? 0;
          const avg = avgMap.get(s.id) ?? null;
          return {
            id: s.id, full_name: s.full_name || "Estudiante", grade: s.grade,
            xp: g.xp ?? 0, energy,
            level_name: g.level_name ?? "Explorador",
            last_activity: g.last_activity ?? null,
            avg_grade: avg,
            risk: calcRisk(avg, energy),
          };
        });
      setRows(merged);
      setLoading(false);
    };
    load();
    if (scope !== "assigned" || !user) return;
    const channel = supabase
      .channel(`asignaciones-docente-${user.id}`)
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "asignaciones", filter: `docente_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, user, scope]);

  return (
    <Card className="cloud-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          {scope === "assigned" ? "Mis Estudiantes Asignados" : "Panel de estudiantes"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {scope === "assigned" && (
          <div className="text-xs bg-yellow-500/10 border border-yellow-500/30 rounded p-2 space-y-0.5">
            <div>Tu ID de docente: <code className="break-all">{user?.id}</code></div>
            <div>Estudiantes asignados encontrados: <strong>{assignedCount}</strong></div>
          </div>
        )}
        {debugError && (
          <div className="text-xs bg-red-500/10 border border-red-500/30 text-red-300 rounded p-2">
            {debugError}
          </div>
        )}
        {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {scope === "assigned"
              ? "Aún no tienes estudiantes asignados. Tu institución te asignará estudiantes pronto."
              : "Aún no hay estudiantes en tu institución."}
          </p>
        )}
        {rows.map((r) => {
          const rb = riskBadge(r.risk);
          return (
            <Card
              key={r.id}
              className="p-3 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => setSelected(r.id)}
            >
              <div className="grid md:grid-cols-5 gap-3 items-center">
                <div>
                  <h4 className="font-semibold">{r.full_name}</h4>
                  <p className="text-xs text-muted-foreground">{r.grade || "Sin grado"}</p>
                </div>
                <Badge variant={rb.v} className="w-fit gap-1">{rb.icon} {rb.label}</Badge>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <Badge variant="secondary">{r.level_name}</Badge>
                  <span className="text-xs text-muted-foreground">{r.xp} XP</span>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Energía</span>
                    <span>{r.energy}/100</span>
                  </div>
                  <Progress value={r.energy} className="h-2" />
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.avg_grade != null && <div>Promedio: {r.avg_grade.toFixed(1)}</div>}
                  {r.last_activity ? `Últ. actividad: ${new Date(r.last_activity).toLocaleDateString()}` : "Sin actividad"}
                </div>
              </div>
            </Card>
          );
        })}
        <StudentProfileDialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)} studentId={selected} />
      </CardContent>
    </Card>
  );
}
