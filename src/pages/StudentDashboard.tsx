import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecommendationsPanel from "@/components/dashboard/RecommendationsPanel";
import GamificationHeader from "@/components/dashboard/GamificationHeader";
import SkillsPanel from "@/components/dashboard/SkillsPanel";
import VideoModal from "@/components/dashboard/VideoModal";
import MentorChatBubble from "@/components/dashboard/MentorChatBubble";
import AchievementsDialog from "@/components/dashboard/AchievementsDialog";
import ProfileDialog from "@/components/dashboard/ProfileDialog";
import NotificationsBell from "@/components/dashboard/NotificationsBell";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import AIActivityCard from "@/components/dashboard/AIActivityCard";
import AssignedActivitiesCard from "@/components/dashboard/AssignedActivitiesCard";
import SubjectHeroButton from "@/components/acompanamiento/SubjectHeroButton";
import SkillsSupport from "@/components/dashboard/SkillsSupport";
import AssignedTeachersCard from "@/components/dashboard/AssignedTeachersCard";
import MyMentorshipsStudentCard from "@/components/dashboard/MyMentorshipsStudentCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Play, CheckCircle, Clock, User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [videoModal, setVideoModal] = useState<{ open: boolean; title: string; videoIds: string[] }>({
    open: false,
    title: "",
    videoIds: [],
  });

  // Track platform interaction on dashboard visit
  useEffect(() => {
    if (user) {
      (supabase as any).from("platform_interactions").insert({
        user_id: user.id,
        interaction_type: "dashboard_visit",
        metadata: { page: "student_dashboard" },
      });
    }
  }, [user]);

  const [progressData, setProgressData] = useState({ completed: 0, total: 0 });

  const loadProgress = async () => {
    if (!user) return;
    const [acts, chs] = await Promise.all([
      (supabase as any).from("student_activities")
        .select("id,status").eq("student_id", user.id),
      (supabase as any).from("daily_challenges")
        .select("id,completed").eq("student_id", user.id),
    ]);
    const aList = acts.data || [];
    const cList = chs.data || [];
    const completed =
      aList.filter((a: any) => a.status === "completed").length +
      cList.filter((c: any) => c.completed).length;
    const total = Math.max(1, aList.length + cList.length);
    setProgressData({ completed, total });
  };

  useEffect(() => { loadProgress(); }, [user]);

  useEffect(() => {
    const handler = () => loadProgress();
    window.addEventListener("learnlink:activity-completed", handler);
    return () => window.removeEventListener("learnlink:activity-completed", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const completedActivities = progressData.completed;
  const totalActivities = progressData.total;
  const progress = totalActivities ? (completedActivities / totalActivities) * 100 : 0;

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Estudiante";
  const displayGrade = profile?.grade || "Sin grado asignado";
  const displayInstitution = profile?.institution || "Sin institución";

  const activities = {
    academic: [
      { title: "Técnicas de Estudio", completed: true, duration: "45 min", videos: ["ukLnPbIffxE", "yVoiR8YtjEM"] },
      { title: "Matemáticas Básicas", completed: false, duration: "60 min", videos: ["F4l1aLnGm3w", "8sVoxAuvnAk"] },
      { title: "Comprensión Lectora", completed: true, duration: "30 min", videos: ["3sPRqOCYQEU", "qPZx2kV2EuY"] },
    ],
    social: [
      { title: "Trabajo en Equipo", completed: true, duration: "40 min", videos: ["iQds2iXm9G4", "pZw9veQ76fo"] },
      { title: "Comunicación Efectiva", completed: false, duration: "35 min", videos: ["I6IAhXM-vps", "eIho2S0ZahI"] },
      { title: "Resolución de Conflictos", completed: false, duration: "50 min", videos: ["KY5TWVz5ZDU", "fH4QZ2pH4kU"] },
    ],
    emotional: [
      { title: "Manejo del Estrés", completed: true, duration: "25 min", videos: ["hnpQrMqDoqE", "MIr3RsUWrdo"] },
      { title: "Autoestima", completed: false, duration: "30 min", videos: ["Yp1NZTBpc6w", "F2hc2FLOdhI"] },
      { title: "Inteligencia Emocional", completed: true, duration: "45 min", videos: ["LgUCyWhJf6s", "auXNnTmhHsk"] },
    ],
    general: [
      { title: "Organización Personal", completed: true, duration: "20 min", videos: ["Z6vRCwVK3Mk", "BvuzG-DYFVg"] },
      { title: "Metas y Objetivos", completed: false, duration: "40 min", videos: ["L4N1q4RNi9I", "u4ZoJKF_VuA"] },
    ],
  };

  const teachers = [
    { name: "Prof. Ana Martínez", specialty: "Matemáticas", experience: "15 años", phone: "+57 300 123 4567", email: "ana.martinez@colegio.edu", consultingHours: "Lunes y Miércoles 2-4 PM" },
    { name: "Prof. Carlos Ruiz", specialty: "Psicología", experience: "10 años", phone: "+57 301 234 5678", email: "carlos.ruiz@colegio.edu", consultingHours: "Martes y Jueves 1-3 PM" },
  ];

  const openVideos = (title: string, videoIds: string[]) => {
    setVideoModal({ open: true, title, videoIds });
    if (user) {
      (supabase as any).from("platform_interactions").insert({
        user_id: user.id,
        interaction_type: "video_open",
        metadata: { title },
      });
    }
  };

  const renderActivities = (items: typeof activities.academic) => (
    <div className="space-y-3">
      {items.map((activity, index) => (
        <div key={index} className="flex items-center justify-between p-3 rounded-lg cloud-card">
          <div className="flex items-center gap-3">
            {activity.completed ? <CheckCircle className="w-5 h-5 text-accent" /> : <Play className="w-5 h-5 text-primary" />}
            <div>
              <h4 className="font-medium">{activity.title}</h4>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {activity.duration}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={activity.completed ? "outline" : "default"}
            onClick={() => openVideos(activity.title, activity.videos)}
          >
            {activity.completed ? "Repasar" : "Iniciar"}
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Gamification header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <GamificationHeader name={displayName} />
              </div>
              <div className="pt-2"><NotificationsBell /></div>
            </div>
          </div>

          {/* Student identity card */}
          <Card className="cloud-card mb-6 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Mis datos</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div><p className="text-muted-foreground text-xs">Nombre</p><p className="font-medium">{displayName}</p></div>
              <div><p className="text-muted-foreground text-xs">Grado</p><p className="font-medium">{displayGrade}</p></div>
              <div><p className="text-muted-foreground text-xs">Institución</p><p className="font-medium">{displayInstitution}</p></div>
              <div><p className="text-muted-foreground text-xs">Correo</p><p className="font-medium truncate">{user?.email}</p></div>
              {profile?.phone && <div><p className="text-muted-foreground text-xs">Teléfono</p><p className="font-medium">{profile.phone}</p></div>}
              {profile?.location && <div><p className="text-muted-foreground text-xs">Ubicación</p><p className="font-medium">{profile.location}</p></div>}
              {profile?.apodo_estudiante && <div><p className="text-muted-foreground text-xs">Apodo</p><p className="font-medium">{profile.apodo_estudiante}</p></div>}
              {profile?.nombre_ia && <div><p className="text-muted-foreground text-xs">IA</p><p className="font-medium">{profile.nombre_ia}</p></div>}
            </CardContent>
          </Card>

          {/* AI-chosen subject activity */}
          <div className="mb-6">
            <SubjectHeroButton />
          </div>

          <div className="mb-6">
            <AssignedActivitiesCard />
          </div>

          <div className="mb-6">
            <AIActivityCard />
          </div>

          {/* Notificaciones destacadas */}
          <div className="mb-6">
            <NotificationsPanel />
          </div>

          {/* Mis Mentorías */}
          <div className="mb-6">
            <MyMentorshipsStudentCard />
          </div>

          {/* Skills */}
          <div className="mb-6 grid md:grid-cols-2 gap-6">
            <SkillsPanel />
            <Card className="cloud-card">
              <CardHeader><CardTitle>Progreso general</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span>{completedActivities}/{totalActivities} actividades</span>
                  <span className="text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <AchievementsDialog />
            <ProfileDialog />
          </div>

          {/* AI Recommendations Panel */}
          <div className="mb-8">
            <RecommendationsPanel />
          </div>

          {/* Habilidades y Apoyo */}
          <div className="mb-8">
            <SkillsSupport />
          </div>

          {/* Docentes asignados */}
          <div className="mb-8">
            <AssignedTeachersCard />
          </div>

          {/* Maestros de Apoyo */}
          <Card className="cloud-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Tus Maestros de Apoyo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {teachers.map((teacher, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-primary">{teacher.name}</h4>
                      <p className="text-sm text-muted-foreground">{teacher.specialty}</p>
                      <p className="text-sm">📞 {teacher.phone}</p>
                      <p className="text-sm">✉️ {teacher.email}</p>
                      <p className="text-sm">🕒 {teacher.consultingHours}</p>
                      <div className="text-sm text-accent">{teacher.experience} de experiencia</div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <MentorChatBubble />
      <VideoModal
        open={videoModal.open}
        onOpenChange={(o) => setVideoModal((s) => ({ ...s, open: o }))}
        title={videoModal.title}
        videoIds={videoModal.videoIds}
      />
    </div>
  );
};

export default StudentDashboard;
