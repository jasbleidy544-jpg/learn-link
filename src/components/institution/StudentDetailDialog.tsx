import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Bookmark, Calendar, History } from "lucide-react";

interface Props {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudentDetailDialog({ studentId, open, onOpenChange }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [risk, setRisk] = useState<any>(null);
  const [logins, setLogins] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !studentId) return;
    (async () => {
      const [{ data: p }, { data: js }, { data: pr }, { data: dx }, { data: rs }, { data: li }] = await Promise.all([
        (supabase as any).from("profiles").select("*").eq("id", studentId).maybeSingle(),
        (supabase as any).from("subject_journeys").select("*").eq("user_id", studentId),
        (supabase as any).from("subject_level_progress").select("*").eq("user_id", studentId).order("completed_at", { ascending: false }),
        (supabase as any).from("subject_diagnostics").select("*").eq("user_id", studentId).order("created_at", { ascending: false }),
        (supabase as any).from("student_risk").select("*").eq("user_id", studentId).maybeSingle(),
        (supabase as any).from("platform_interactions").select("created_at, interaction_type, metadata").eq("user_id", studentId).eq("interaction_type", "login").order("created_at", { ascending: false }).limit(10),
      ]);
      setProfile(p);
      setJourneys(js || []);
      setProgress(pr || []);
      setDiagnostics(dx || []);
      setRisk(rs);
      setLogins(li || []);
    })();
  }, [studentId, open]);

  const riskCls = risk?.risk_level === "high"
    ? "bg-red-500/20 text-red-300 border-red-500/40"
    : risk?.risk_level === "medium"
      ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
      : "bg-green-500/20 text-green-300 border-green-500/40";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{profile?.full_name || "Estudiante"}</DialogTitle>
          <DialogDescription>
            {profile?.grade ? `Grado ${profile.grade} · ` : ""}{profile?.email}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-5">
            {risk && (
              <section className="cloud-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4" /> Análisis de riesgo (IA)</h3>
                  <Badge variant="outline" className={riskCls}>{risk.risk_level === "high" ? "🔴 Alto" : risk.risk_level === "medium" ? "🟠 Medio" : "🟢 Bajo"}</Badge>
                </div>
                {risk.ai_note && <p className="text-sm mt-3 text-muted-foreground">{risk.ai_note}</p>}
                {risk.factors && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                    <div className="cloud-card p-2"><div className="text-muted-foreground">Días sin acceso</div><div className="font-bold">{risk.factors.days_since_last_sign_in}</div></div>
                    <div className="cloud-card p-2"><div className="text-muted-foreground">Progreso</div><div className="font-bold">{risk.factors.progress_pct}%</div></div>
                    <div className="cloud-card p-2"><div className="text-muted-foreground">Completadas</div><div className="font-bold">{risk.factors.activities_completed}</div></div>
                    <div className="cloud-card p-2"><div className="text-muted-foreground">Abandonadas</div><div className="font-bold">{risk.factors.activities_abandoned}</div></div>
                  </div>
                )}
              </section>
            )}

            <section>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><Bookmark className="w-4 h-4" /> Camino por materia</h3>
              {journeys.length === 0 && <p className="text-sm text-muted-foreground">Aún no ha iniciado ningún acompañamiento.</p>}
              <div className="space-y-2">
                {journeys.map((j) => {
                  const total = Array.isArray(j.camino) ? j.camino.length : 0;
                  const done = progress.filter((p) => p.subject === j.subject && p.score?.passed).length;
                  return (
                    <div key={j.id} className="cloud-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium capitalize">{j.subject}</div>
                        <Badge variant="outline">Nivel {j.current_level}/{total || "?"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{done} niveles superados</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><Calendar className="w-4 h-4" /> Diagnósticos</h3>
              {diagnostics.length === 0 && <p className="text-sm text-muted-foreground">Sin diagnósticos completados.</p>}
              <div className="space-y-2">
                {diagnostics.slice(0, 5).map((d) => (
                  <div key={d.id} className="cloud-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium capitalize">{d.subject}</div>
                      <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><History className="w-4 h-4" /> Últimos accesos</h3>
              {logins.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin accesos recientes registrados.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {logins.map((l, i) => (
                    <li key={i} className="text-muted-foreground">• {new Date(l.created_at).toLocaleString()}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}