import Navbar from "@/components/Navbar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StudentsOverview from "@/components/teacher/StudentsOverview";
import ScheduleMeetingDialog from "@/components/teacher/ScheduleMeetingDialog";
import CreateActivityDialog from "@/components/teacher/CreateActivityDialog";
import TeacherRecommendations from "@/components/teacher/TeacherRecommendations";
import MentorRequestsPanel from "@/components/teacher/MentorRequestsPanel";
import RetiredAssignmentRequests from "@/components/teacher/RetiredAssignmentRequests";
import MyMentorshipsCard from "@/components/teacher/MyMentorshipsCard";
import MiInstitucionSection from "@/components/teacher/institucion/MiInstitucionSection";
import { useAuth } from "@/hooks/useAuth";
import { User, Star, HeartHandshake, ClipboardList } from "lucide-react";

const TeacherDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (profile?.teacher_type === "retired") {
      navigate("/panel-jubilado", { replace: true });
    }
  }, [profile, navigate]);
  const teacherType: string = profile?.teacher_type === "retired" ? "retired" : "active";
  const isRetired = teacherType === "retired";
  const name = profile?.full_name || user?.email?.split("@")[0] || "Docente";
  const roleLabel = isRetired ? "👴 Docente Voluntario Jubilado" : "👨‍🏫 Docente Activo Voluntario";
  const roleIcon = isRetired
    ? <HeartHandshake className="w-4 h-4 text-pink-400" />
    : <Star className="w-4 h-4 text-yellow-400 fill-current" />;

  const scope: "institution" | "assigned" = "assigned";

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <Card className="cloud-card glow-effect">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gradient">{name}</h1>
                  <p className="text-muted-foreground text-sm">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {roleIcon}
                    <Badge variant="secondary">{roleLabel}</Badge>
                    {profile?.institution && <Badge variant="outline">{profile.institution}</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones — sin mensajes ni chat para docentes voluntarios */}
          <div className="grid md:grid-cols-2 gap-4">
            <CreateActivityDialog scope="assigned" />
            <ScheduleMeetingDialog scope="assigned" />
          </div>

          <Button asChild variant="outline" className="w-full md:w-auto">
            <Link to="/teacher-dashboard/historial">
              <ClipboardList className="w-4 h-4 mr-2" />
              📋 Historial de actividades
            </Link>
          </Button>

          <StudentsOverview scope={scope} />

          {!isRetired && <MiInstitucionSection />}

          <MyMentorshipsCard />

          {isRetired && <RetiredAssignmentRequests />}
          {isRetired && <MentorRequestsPanel />}

          <TeacherRecommendations
            scope={scope}
            title={isRetired ? "Debilidades detectadas por la IA" : "Recomendaciones de la IA"}
          />
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
