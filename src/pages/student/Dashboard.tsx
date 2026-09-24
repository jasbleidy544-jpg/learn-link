import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import GamificationHeader from "@/components/dashboard/GamificationHeader";
import NotificationsBell from "@/components/dashboard/NotificationsBell";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import AIActivityCard from "@/components/dashboard/AIActivityCard";
import AssignedActivitiesCard from "@/components/dashboard/AssignedActivitiesCard";
import MyMentorshipsStudentCard from "@/components/dashboard/MyMentorshipsStudentCard";
import SubjectHeroButton from "@/components/acompanamiento/SubjectHeroButton";

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState({ completed: 0, total: 0 });

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

  useEffect(() => {
    loadProgress();
  }, [user]);

  useEffect(() => {
    const handler = () => loadProgress();
    window.addEventListener("learnlink:activity-completed", handler);
    return () => window.removeEventListener("learnlink:activity-completed", handler);
  }, [user]);

  const progress = progressData.total
    ? (progressData.completed / progressData.total) * 100
    : 0;

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "Estudiante";

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