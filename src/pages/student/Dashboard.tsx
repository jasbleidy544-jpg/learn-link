import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GamificationHeader from "@/components/dashboard/GamificationHeader";
import NotificationsBell from "@/components/dashboard/NotificationsBell";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import AIActivityCard from "@/components/dashboard/AIActivityCard";
import AssignedActivitiesCard from "@/components/dashboard/AssignedActivitiesCard";
import MyMentorshipsStudentCard from "@/components/dashboard/MyMentorshipsStudentCard";
import SubjectHeroButton from "@/components/acompanamiento/SubjectHeroButton";
import { Brain, Loader2, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

type Rec = {
  id: string;
  type: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high" | "critical";
};

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [progressData, setProgressData] = useState({ completed: 0, total: 0 });
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [lastMetrics, setLastMetrics] = useState<any>(null);

  const loadProgress = async () => {
    if (!user) return;
    const [acts, chs] = await Promise.all([
      (supabase as any)
        .from("student_activities")
        .select("id,status")
        .eq("student_id", user.id),
      (supabase as any)
        .from("daily_challenges")
        .select("id,completed")
        .eq("student_id", user.id),
    ]);
    const aList = acts.data || [];
    const cList = chs.data || [];
    const completed =
      aList.filter((a: any) => a.status === "completed").length +
      cList.filter((c: any) => c.completed).length;
    const total = Math.max(1, aList.length + cList.length);
    setProgressData({ completed, total });
  };

  const loadRecommendations = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("ai_recommendations")
      .select("id, type, title, content, priority")
      .eq("student_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(4);
    setRecs(data || []);
  };

  useEffect(() => {
    loadProgress();
    loadRecommendations();
  }, [user]);

  useEffect(() => {
    const handler = () => loadProgress();
    window.addEventListener("learnlink:activity-completed", handler);
    return () => window.removeEventListener("learnlink:activity-completed", handler);
  }, [user]);

  const runAnalysis = async () => {
    if (!user) return;
    setAnalysisRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-student");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLastMetrics(data?.metrics || null);
      toast.success("Análisis completado ✨");
      await loadRecommendations();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo analizar en este momento");
    } finally {
      setAnalysisRunning(false);
    }
  };

  const progress = progressData.total
    ? (progressData.completed / progressData.total) * 100
    : 0;

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "Estudiante";

  const priorityVariant = (p: Rec["priority"]) => {
    if (p === "critical") return "destructive";
    if (p === "high") return "destructive";
    if (p === "medium") return "secondary";
    return "outline";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Gamificación */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <GamificationHeader name={displayName} />
        </div>
        <div className="pt-2">
          <NotificationsBell />
        </div>
      </div>

      {/* Análisis IA */}
      <Card className="cloud-card border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-5 h-5 text-primary" />
            Análisis personalizado con IA
          </CardTitle>
          <Button
            size="sm"
            onClick={runAnalysis}
            disabled={analysisRunning}
            className="gap-2"
          >
            {analysisRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analizar
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recs.length === 0 && !analysisRunning && (
            <p className="text-sm text-muted-foreground">
              Pulsa <strong>Analizar</strong> para que tu IA revise tu progreso y te dé recomendaciones personalizadas.
            </p>
          )}

          {lastMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded bg-muted/40">
                <p className="text-muted-foreground">Promedio</p>
                <p className="font-semibold">{lastMetrics.avgGrade}</p>
              </div>
              <div className="p-2 rounded bg-muted/40">
                <p className="text-muted-foreground">Asistencia</p>
                <p className="font-semibold">{lastMetrics.attendanceRate}%</p>
              </div>
              <div className="p-2 rounded bg-muted/40">
                <p className="text-muted-foreground">Interacciones (7d)</p>
                <p className="font-semibold">{lastMetrics.recentInteractions}</p>
              </div>
              <div className="p-2 rounded bg-muted/40">
                <p className="text-muted-foreground">Total interacciones</p>
                <p className="font-semibold">{lastMetrics.totalInteractions}</p>
              </div>
            </div>
          )}

          {recs.map((r) => (
            <div
              key={r.id}
              className="p-3 rounded-lg border border-border/60 bg-card/40 flex items-start gap-3"
            >
              <div className="mt-0.5">
                {r.priority === "high" || r.priority === "critical" ? (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-sm">{r.title}</h4>
                  <Badge variant={priorityVariant(r.priority)} className="text-[10px]">
                    {r.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                  {r.content}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Acompañamiento digital */}
      <div>
        <SubjectHeroButton />
      </div>

      {/* Actividades asignadas */}
      <AssignedActivitiesCard />

      {/* Actividad recomendada por IA */}
      <AIActivityCard />

      {/* Notificaciones */}
      <NotificationsPanel />

      {/* Mis mentorías */}
      <MyMentorshipsStudentCard />

      {/* Progreso general */}
      <Card className="cloud-card">
        <CardHeader>
          <CardTitle>Progreso general</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span>
              {progressData.completed}/{progressData.total} actividades
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard; 