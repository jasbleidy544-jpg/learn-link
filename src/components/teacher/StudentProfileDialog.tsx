import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Building, GraduationCap, ShieldAlert, ShieldCheck, AlertTriangle, Trophy, Zap, Calendar, BookOpen, Sparkles } from "lucide-react";

type Risk = "alto" | "medio" | "bajo" | "sin datos";
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentId: string | null;
}

export default function StudentProfileDialog({ open, onOpenChange, studentId }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [gam, setGam] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [risk, setRisk] = useState<Risk>("sin datos");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !studentId) return;
    setLoading(true);
    (async () => {
      const [p, g, a, m, r, gr] = await Promise.all([
        (supabase as any).from("profiles").select("*").eq("id", studentId).maybeSingle(),
        (supabase as any).from("student_gamification").select("*").eq("user_id", studentId).maybeSingle(),
        (supabase as any).from("student_activities").select("*").eq("student_id", studentId).order("created_at", { ascending: false }).limit(8),
        (supabase as any).from("mentorship_sessions").select("*").eq("student_id", studentId).order("scheduled_at", { ascending: false }).limit(8),
        (supabase as any).from("ai_recommendations").select("*").eq("student_id", studentId).order("generated_at", { ascending: false }).limit(5),
        (supabase as any).from("academic_records").select("grade_value").eq("student_id", studentId),
      ]);
      setProfile(p?.data || null);
      setGam(g?.data || null);
      setActivities(a?.data || []);
      setMeetings(m?.data || []);
      setRecs(r?.data || []);
      const grades: number[] = (gr?.data || []).map((x: any) => Number(x.grade_value));
      const avg = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : null;
      const energy = g?.data?.energy ?? 0;
      let rk: Risk = "sin datos";
      if (avg != null || energy > 0) {
        const score = (avg ?? 70) * 0.7 + energy * 0.3;
        rk = score < 55 ? "alto" : score < 72 ? "medio" : "bajo";
      }
      setRisk(rk);
      setLoading(false);
    })();
  }, [open, studentId]);

  const riskBadge = () => {
    if (risk === "alto") return <Badge variant="destructive" className="gap-1"><ShieldAlert className="w-3 h-3" /> Riesgo alto</Badge>;
    if (risk === "medio") return <Badge variant="secondary" className="gap-1"><AlertTriangle className="w-3 h-3 text-amber-400" /> Riesgo medio</Badge>;
    if (risk === "bajo") return <Badge variant="outline" className="gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> Riesgo bajo</Badge>;
    return <Badge variant="outline">Sin datos</Badge>;
  };

  const attended = meetings.filter((m) => m.attended).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{profile?.full_name || "Estudiante"}</DialogTitle>
          <DialogDescription>Perfil completo del estudiante</DialogDescription>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {!loading && profile && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">{riskBadge()}
              <Badge variant="secondary" className="gap-1"><Trophy className="w-3 h-3 text-yellow-400" /> {gam?.level_name || "Explorador"}</Badge>
              <Badge variant="outline">{gam?.xp ?? 0} XP</Badge>
            </div>

            <Card className="p-3 space-y-1 text-sm">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {profile.email || "—"}</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {profile.phone || "—"}</div>
              <div className="flex items-center gap-2"><Building className="w-4 h-4 text-muted-foreground" /> {profile.institution || "—"}</div>
              <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-muted-foreground" /> {profile.grade || "Sin grado"}</div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Energía / progreso</span>
                <span>{gam?.energy ?? 0}/100</span>
              </div>
              <Progress value={gam?.energy ?? 0} className="h-2" />
            </Card>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Últimas actividades</h4>
              {activities.length === 0 && <p className="text-xs text-muted-foreground">Sin actividades aún.</p>}
              <div className="space-y-2">
                {activities.map((a) => (
                  <Card key={a.id} className="p-2 text-sm flex items-center justify-between">
                    <span>{a.title}</span>
                    <Badge variant={a.status === "completed" ? "secondary" : "outline"} className="text-xs">{a.status}</Badge>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Reuniones ({attended}/{meetings.length} asistidas)</h4>
              {meetings.length === 0 && <p className="text-xs text-muted-foreground">Sin reuniones programadas.</p>}
              <div className="space-y-2">
                {meetings.map((m) => (
                  <Card key={m.id} className="p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>{m.topic || "Mentoría"}</span>
                      <Badge variant={m.attended ? "secondary" : "outline"} className="text-xs">{m.attended ? "Asistió" : "Pendiente"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(m.scheduled_at).toLocaleString()}</p>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Observaciones de la IA</h4>
              {recs.length === 0 && <p className="text-xs text-muted-foreground">Sin observaciones generadas.</p>}
              <div className="space-y-2">
                {recs.map((r) => (
                  <Card key={r.id} className="p-2 text-sm">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.content}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
