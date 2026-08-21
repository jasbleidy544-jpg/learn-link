import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import StudentsOverview from "@/components/teacher/StudentsOverview";
import CreateActivityDialog from "@/components/teacher/CreateActivityDialog";
import RetiredAssignmentRequests from "@/components/teacher/RetiredAssignmentRequests";
import TeacherRecommendations from "@/components/teacher/TeacherRecommendations";
import ScheduleMeetingDialog from "@/components/teacher/ScheduleMeetingDialog";
import MyMentorshipsCard from "@/components/teacher/MyMentorshipsCard";
import { User, HeartHandshake, ClipboardList, Building2 } from "lucide-react";

type LinkedInst = {
  id: string;
  name: string;
  students_count: number;
  linked_at: string | null;
};

export default function RetiredTeacherDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [linked, setLinked] = useState<LinkedInst[]>([]);
  const [loadingInst, setLoadingInst] = useState(true);

  // Redirect non-retired teachers to the active panel
  useEffect(() => {
    if (profile && profile.teacher_type !== "retired") {
      navigate("/teacher-dashboard", { replace: true });
    }
  }, [profile, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoadingInst(true);
      const { data: asigns, error } = await (supabase as any)
        .from("asignaciones")
        .select("institution_id, creado_en")
        .eq("docente_id", user.id);
      if (error) {
        console.error("[RetiredTeacherDashboard] asignaciones", error);
        setLoadingInst(false);
        return;
      }
      const grouped = new Map<string, { count: number; first: string | null }>();
      (asigns || []).forEach((a: any) => {
        if (!a.institution_id) return;
        const cur = grouped.get(a.institution_id) || { count: 0, first: null };
        cur.count += 1;
        if (!cur.first || (a.creado_en && a.creado_en < cur.first)) cur.first = a.creado_en;
        grouped.set(a.institution_id, cur);
      });
      const ids = Array.from(grouped.keys());
      if (ids.length === 0) {
        setLinked([]);
        setLoadingInst(false);
        return;
      }
      const { data: insts } = await (supabase as any)
        .from("institutions")
        .select("id, name")
        .in("id", ids);
      const iMap = new Map((insts || []).map((i: any) => [i.id, i.name]));
      setLinked(
        ids.map((id) => ({
          id,
          name: (iMap.get(id) as string) || "Institución",
          students_count: grouped.get(id)!.count,
          linked_at: grouped.get(id)!.first,
        }))
      );
      setLoadingInst(false);
    };
    load();

    // Refresh when new asignaciones are created (after accepting a request)
    if (!user) return;
    const ch = supabase
      .channel(`linked-inst-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "asignaciones", filter: `docente_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  const name = profile?.full_name || user?.email?.split("@")[0] || "Docente";

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
                  <h1 className="text-2xl font-bold text-gradient">
                    Panel Docente Voluntario Jubilado
                  </h1>
                  <p className="text-muted-foreground text-sm">{name} · {user?.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <HeartHandshake className="w-4 h-4 text-pink-400" />
                    <Badge variant="secondary">Docente Jubilado 🏅</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="grid md:grid-cols-3 gap-4">
            <CreateActivityDialog scope="assigned" />
            <ScheduleMeetingDialog scope="assigned" />
            <RetiredAssignmentRequests />
          </div>

          <Button asChild variant="outline" className="w-full md:w-auto">
            <Link to="/teacher-dashboard/historial">
              <ClipboardList className="w-4 h-4 mr-2" />
              📋 Historial de actividades
            </Link>
          </Button>

          <StudentsOverview scope="assigned" />

          <MyMentorshipsCard />

          {/* Mis Instituciones Vinculadas */}
          <Card className="cloud-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Mis Instituciones Vinculadas ({linked.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInst ? (
                <p className="text-sm text-muted-foreground text-center py-4">Cargando…</p>
              ) : linked.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aún no estás vinculado a ninguna institución. Cuando aceptes una solicitud, aparecerá aquí.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="text-left text-muted-foreground border-b border-border">
                      <tr>
                        <th className="py-2 pr-3">Institución</th>
                        <th className="py-2 pr-3">Fecha de vinculación</th>
                        <th className="py-2 pr-3">Estudiantes asignados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linked.map((i) => (
                        <tr key={i.id} className="border-b border-border/40">
                          <td className="py-2 pr-3 font-medium">{i.name}</td>
                          <td className="py-2 pr-3">
                            {i.linked_at ? new Date(i.linked_at).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-2 pr-3">
                            <Badge variant="secondary">{i.students_count}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <TeacherRecommendations
            scope="assigned"
            title="Debilidades detectadas por la IA"
          />
        </div>
      </div>
    </div>
  );
}