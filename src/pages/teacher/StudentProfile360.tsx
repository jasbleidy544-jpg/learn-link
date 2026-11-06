import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import EvolvingAvatar from "@/components/dashboard/EvolvingAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLevelInfo, getProgressToNextLevel } from "@/lib/gamification";
import {
  ArrowLeft, Loader2, ShieldAlert, ShieldCheck, AlertTriangle, Zap, Flame, Trophy,
  BookOpen, Video, MessageCircle, Sparkles, LineChart as LineChartIcon, Award, Users, ClipboardList,
} from "lucide-react";
import CreateActivityDialog from "@/components/teacher/CreateActivityDialog";
import ScheduleMeetingDialog from "@/components/teacher/ScheduleMeetingDialog";
import SendMessageDialog from "@/components/teacher/SendMessageDialog";
import SummaryTab from "@/components/teacher/student360/SummaryTab";
import ProgressTab from "@/components/teacher/student360/ProgressTab";
import AchievementsTab from "@/components/teacher/student360/AchievementsTab";
import MentorshipsTab from "@/components/teacher/student360/MentorshipsTab";
import ActivitiesTab from "@/components/teacher/student360/ActivitiesTab";

type Risk = "alto" | "medio" | "bajo" | "sin_diagnostico";

type StudentCore = {
  id: string;
  full_name: string;
  grade: string | null;
  xp_total: number;
  level: number;
  energy: number;
  streak_days: number;
  risk: Risk;
};

const riskConfig: Record<Risk, { label: string; icon: JSX.Element; className: string }> = {
  alto: {
    label: "Riesgo alto",
    icon: <ShieldAlert className="w-4 h-4" />,
    className: "bg-red-500/15 text-red-300 border-red-500/40",
  },
  medio: {
    label: "Riesgo medio",
    icon: <AlertTriangle className="w-4 h-4" />,
    className: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  },
  bajo: {
    label: "Riesgo bajo",
    icon: <ShieldCheck className="w-4 h-4" />,
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  },
  sin_diagnostico: {
    label: "Sin diagnóstico",
    icon: <Users className="w-4 h-4" />,
    className: "bg-muted text-muted-foreground border-border",
  },
};

export default function StudentProfile360() {
  const { studentId } = useParams();
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentCore | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("resumen");

  useEffect(() => {
    if (!studentId || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);

      const [{ data: profileRow, error: pErr }, { data: statsRow }, { data: diagRows }] = await Promise.all([
        (supabase as any)
          .from("profiles")
          .select("id, full_name, grade, grado")
          .eq("id", studentId)
          .maybeSingle(),
        (supabase as any)
          .from("user_stats")
          .select("xp_total, level, energy, streak_days")
          .eq("user_id", studentId)
          .maybeSingle(),
        (supabase as any)
          .from("diagnosticos")
          .select("nivel_riesgo, completed_at")
          .eq("user_id", studentId)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(1),
      ]);

      if (cancelled) return;

      if (pErr || !profileRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const risk: Risk = diagRows?.[0]?.nivel_riesgo ?? "sin_diagnostico";

      setStudent({
        id: profileRow.id,
        full_name: profileRow.full_name || "Estudiante",
        grade: profileRow.grado || profileRow.grade || null,
        xp_total: statsRow?.xp_total ?? 0,
        level: statsRow?.level ?? 1,
        energy: statsRow?.energy ?? 100,
        streak_days: statsRow?.streak_days ?? 0,
        risk,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [studentId, user]);

  if (loading) {
    return (
      <div className="min-h-screen night-sky">
        <Navbar />
        <div className="pt-32 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (notFound || !student) {
    return (
      <div className="min-h-screen night-sky">
        <Navbar />
        <div className="pt-28 px-4 max-w-xl mx-auto text-center space-y-4">
          <p className="text-muted-foreground">
            No encontramos este expediente, o no tienes acceso a este estudiante.
          </p>
          <Button asChild variant="outline">
            <Link to="/teacher-dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Volver al panel</Link>
          </Button>
        </div>
      </div>
    );
  }

  const rc = riskConfig[student.risk];
  const progress = getProgressToNextLevel(student.xp_total);
  const levelInfo = getLevelInfo(student.level);
  const lockedStudent = { id: student.id, full_name: student.full_name };

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/teacher-dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Volver a mis estudiantes</Link>
          </Button>

          {/* Encabezado */}
          <Card className="cloud-card glow-effect overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <EvolvingAvatar name={student.full_name} levelIndex={student.level - 1} />
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-gradient truncate">{student.full_name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {student.grade ? `Grado ${student.grade}` : "Sin grado registrado"}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className={`gap-1 ${rc.className}`}>{rc.icon} {rc.label}</Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Trophy className="w-3 h-3 text-yellow-400" /> Nivel {student.level} · {levelInfo.title}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-3 lg:w-[360px]">
                  <div className="cloud-card p-3 text-center">
                    <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <div className="text-sm font-bold">{student.energy}/100</div>
                    <div className="text-[11px] text-muted-foreground">Energía</div>
                    <Progress value={student.energy} className="h-1.5 mt-1" />
                  </div>
                  <div className="cloud-card p-3 text-center">
                    <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                    <div className="text-sm font-bold">{student.streak_days}</div>
                    <div className="text-[11px] text-muted-foreground">Días de racha</div>
                  </div>
                  <div className="cloud-card p-3 text-center">
                    <Sparkles className="w-4 h-4 text-primary mx-auto mb-1" />
                    <div className="text-sm font-bold">{student.xp_total}</div>
                    <div className="text-[11px] text-muted-foreground">XP total</div>
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Progreso de nivel</span>
                  <span>{progress.progressPercent}%</span>
                </div>
                <Progress value={progress.progressPercent} className="h-1.5" />
              </div>

              {/* Acciones rápidas */}
              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                <CreateActivityDialog
                  lockedStudent={lockedStudent}
                  trigger={
                    <Button className="w-full gap-2">
                      <BookOpen className="w-4 h-4" /> Asignar nueva tarea
                    </Button>
                  }
                />
                <ScheduleMeetingDialog
                  lockedStudent={lockedStudent}
                  trigger={
                    <Button variant="secondary" className="w-full gap-2">
                      <Video className="w-4 h-4" /> Agendar reunión
                    </Button>
                  }
                />
                <SendMessageDialog
                  lockedStudent={lockedStudent}
                  trigger={
                    <Button variant="outline" className="w-full gap-2">
                      <MessageCircle className="w-4 h-4" /> Enviar mensaje directo
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Pestañas */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="resumen" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Resumen</TabsTrigger>
              <TabsTrigger value="progreso" className="gap-1.5"><LineChartIcon className="w-3.5 h-3.5" /> Progreso académico</TabsTrigger>
              <TabsTrigger value="logros" className="gap-1.5"><Award className="w-3.5 h-3.5" /> Logros</TabsTrigger>
              <TabsTrigger value="mentorias" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Mentorías</TabsTrigger>
              <TabsTrigger value="actividades" className="gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Actividades</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="mt-4">
              <SummaryTab studentId={student.id} />
            </TabsContent>
            <TabsContent value="progreso" className="mt-4">
              <ProgressTab studentId={student.id} />
            </TabsContent>
            <TabsContent value="logros" className="mt-4">
              <AchievementsTab studentId={student.id} />
            </TabsContent>
            <TabsContent value="mentorias" className="mt-4">
              <MentorshipsTab studentId={student.id} />
            </TabsContent>
            <TabsContent value="actividades" className="mt-4">
              <ActivitiesTab studentId={student.id} teacherId={user?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
