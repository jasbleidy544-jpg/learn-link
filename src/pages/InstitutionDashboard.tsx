import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, UserPlus, Edit, Trash2, TrendingUp, FileText,
  BarChart, Building, Copy, KeyRound, Sparkles, GraduationCap,
  ClipboardList, Bot, UserCheck, CalendarCheck
} from "lucide-react";
import InstitutionSummary from "@/components/institution/InstitutionSummary";
import StudentsTable, { StudentRow } from "@/components/institution/StudentsTable";
import TeachersTable, { TeacherRow } from "@/components/institution/TeachersTable";
import StudentDetailDialog from "@/components/institution/StudentDetailDialog";
import TeacherDetailDialog from "@/components/institution/TeacherDetailDialog";
import RetiredTeachersTab from "@/components/institution/RetiredTeachersTab";

const LEVEL_NAMES = ["—", "🌱 Principiante", "📚 Intermedio", "⚡ Avanzado", "🏆 Experto"];

const InstitutionDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState<any>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTeacherId, setAssignTeacherId] = useState<string>("");
  const [assignSelected, setAssignSelected] = useState<Set<string>>(new Set());
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [detailTeacherId, setDetailTeacherId] = useState<string | null>(null);
  // raw students with assigned_teacher_id for the assign dialog
  const [studentsRaw, setStudentsRaw] = useState<any[]>([]);
  // Mapa docente_id -> Set<estudiante_id> desde la tabla `asignaciones`
  const [assignmentsByTeacher, setAssignmentsByTeacher] = useState<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  // Realtime subscriptions
  useEffect(() => {
    if (!institution?.id) return;
    const ch = supabase
      .channel(`inst-${institution.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `institution_id=eq.${institution.id}` }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "student_risk", filter: `institution_id=eq.${institution.id}` }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "subject_journeys" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "subject_level_progress" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "asignaciones", filter: `institution_id=eq.${institution.id}` }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institution?.id]);

  // 30s polling fallback in case realtime fails
  useEffect(() => {
    if (!institution?.id) return;
    const t = setInterval(() => loadData(), 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institution?.id]);

  const loadData = async () => {
    setLoading(true);
    // 1) Usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[InstitutionDashboard] Usuario autenticado:", user?.id, user?.email);
    if (!user) { setLoading(false); return; }

    // 2) Perfil del rector (en este proyecto el vínculo es institution_id, no codigo_institucional)
    const { data: perfil, error: perfilErr } = await supabase
      .from("profiles")
      .select("id, full_name, email, institution, institution_id")
      .eq("id", user.id)
      .maybeSingle();
    console.log("[InstitutionDashboard] Perfil del rector:", perfil, "error:", perfilErr);

    // 3) Institución donde el usuario es owner
    const { data: inst, error: instErr } = await (supabase as any)
      .from("institutions")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();
    console.log("[InstitutionDashboard] Institución del rector:", inst, "error:", instErr);
    console.log(
      "[InstitutionDashboard] Código institucional (estudiantes / docentes):",
      inst?.student_code,
      "/",
      inst?.teacher_code,
    );
    setInstitution(inst);

    if (!inst?.id && !perfil?.institution_id && !perfil?.institution) {
      console.warn("[InstitutionDashboard] Tu cuenta no tiene una institución asignada.");
      setStudents([]); setStudentsRaw([]); setTeachers([]); setLoading(false); return;
    }

    let memberQuery = supabase
      .from("profiles")
      .select("id, full_name, email, grade, subjects, created_at, institution_id, institution, assigned_teacher_id, last_sign_in_at");
    if (inst?.id) {
      memberQuery = memberQuery.eq("institution_id", inst.id);
    } else if (profile?.institution) {
      memberQuery = memberQuery.eq("institution", profile.institution);
    } else {
      setStudents([]); setTeachers([]); setLoading(false); return;
    }
    const { data: members, error: membersErr } = await memberQuery;
    console.log(
      "[InstitutionDashboard] Perfiles vinculados a la institución:",
      members?.length ?? 0,
      members,
      "error:",
      membersErr,
    );

    const ids = (members || []).map((m: any) => m.id);
    if (ids.length === 0) {
      setStudents([]); setStudentsRaw([]);
      setTeachers([]);
      setLoading(false);
      return;
    }
    const { data: roles, error: rolesErr } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids);
    console.log("[InstitutionDashboard] Roles encontrados (user_roles):", roles, "error:", rolesErr);

    const roleMap = new Map<string, string>();
    (roles || []).forEach((r: any) => roleMap.set(r.user_id, r.role));

    const sList = (members || []).filter((m: any) => roleMap.get(m.id) === "student");
    const tList = (members || []).filter((m: any) => roleMap.get(m.id) === "teacher");
    console.log("[InstitutionDashboard] Estudiantes encontrados:", sList.length, sList);
    console.log("[InstitutionDashboard] Docentes encontrados:", tList.length, tList);
    setStudentsRaw(sList);

    const sIds = sList.map((s: any) => s.id);

    // Cargar asignaciones de la institución desde la tabla `asignaciones`
    const { data: asignacionesData, error: asignErr } = await (supabase as any)
      .from("asignaciones")
      .select("estudiante_id, docente_id")
      .eq("institution_id", inst?.id);
    console.log("[InstitutionDashboard] Asignaciones cargadas:", asignacionesData?.length ?? 0, "error:", asignErr);
    const byTeacher = new Map<string, Set<string>>();
    (asignacionesData || []).forEach((a: any) => {
      const set = byTeacher.get(a.docente_id) || new Set<string>();
      set.add(a.estudiante_id);
      byTeacher.set(a.docente_id, set);
    });
    setAssignmentsByTeacher(byTeacher);

    // Subject journeys / level progress / risk for students
    const [{ data: journeys }, { data: progresses }, { data: risks }, { data: aiRecs }] = await Promise.all([
      sIds.length ? (supabase as any).from("subject_journeys").select("user_id, subject, current_level, camino").in("user_id", sIds) : Promise.resolve({ data: [] as any[] }),
      sIds.length ? (supabase as any).from("subject_level_progress").select("user_id, subject, score").in("user_id", sIds) : Promise.resolve({ data: [] as any[] }),
      sIds.length ? (supabase as any).from("student_risk").select("*").in("user_id", sIds) : Promise.resolve({ data: [] as any[] }),
      (supabase as any)
      .from("ai_recommendations")
      .select("*")
        .in("student_id", sIds.length ? sIds : ["00000000-0000-0000-0000-000000000000"])
        .order("generated_at", { ascending: false }),
    ]);
    setRecs(aiRecs || []);

    // Institution meetings (history)
    const teacherIds = tList.map((t: any) => t.id);
    if (teacherIds.length) {
      const { data: ms } = await (supabase as any)
        .from("meetings")
        .select("id, title, scheduled_at, status, host_id, student_id")
        .in("host_id", teacherIds)
        .order("scheduled_at", { ascending: false })
        .limit(50);
      setMeetingsList(ms || []);
    } else {
      setMeetingsList([]);
    }

    // Group per student
    const journeysByUser = new Map<string, any[]>();
    (journeys || []).forEach((j: any) => {
      const arr = journeysByUser.get(j.user_id) || [];
      arr.push(j);
      journeysByUser.set(j.user_id, arr);
    });
    const progressByUser = new Map<string, any[]>();
    (progresses || []).forEach((p: any) => {
      const arr = progressByUser.get(p.user_id) || [];
      arr.push(p);
      progressByUser.set(p.user_id, arr);
    });
    const riskByUser = new Map<string, any>();
    (risks || []).forEach((r: any) => riskByUser.set(r.user_id, r));

    const studentRows: StudentRow[] = sList.map((s: any) => {
      const js = journeysByUser.get(s.id) || [];
      const ps = progressByUser.get(s.id) || [];
      const totalLevels = js.reduce((acc: number, j: any) => acc + (Array.isArray(j.camino) ? j.camino.length : 0), 0);
      const completedLevels = ps.filter((p: any) => p?.score?.passed).length;
      const progress = totalLevels ? Math.round((completedLevels / totalLevels) * 100) : 0;
      const avgLevel = js.length ? Math.round(js.reduce((a: number, j: any) => a + (j.current_level || 1), 0) / js.length) : 0;
      const avgLevelName = avgLevel >= 1 && avgLevel <= 4 ? LEVEL_NAMES[avgLevel] : "—";
      const r = riskByUser.get(s.id);
      const risk_level = (r?.risk_level as StudentRow["risk_level"]) || "unknown";
      return {
        id: s.id,
        full_name: s.full_name,
        email: s.email,
        grade: s.grade,
        active_subjects: js.length,
        avg_level: avgLevel,
        avg_level_name: avgLevelName,
        last_sign_in_at: s.last_sign_in_at,
        created_at: s.created_at,
        institution_code: inst?.student_code ?? null,
        progress,
        risk_level,
      };
    });
    setStudents(studentRows);

    const studentsByTeacher = new Map<string, number>();
    byTeacher.forEach((set, tid) => studentsByTeacher.set(tid, set.size));
    const threeDaysAgo = Date.now() - 3 * 86400000;
    const teacherRows: TeacherRow[] = tList.map((t: any) => ({
      id: t.id,
      full_name: t.full_name,
      email: t.email,
      subjects: t.subjects || "",
      students_count: studentsByTeacher.get(t.id) || 0,
      last_sign_in_at: t.last_sign_in_at,
      created_at: t.created_at,
      institution_code: inst?.teacher_code ?? null,
      active: t.last_sign_in_at ? new Date(t.last_sign_in_at).getTime() >= threeDaysAgo : false,
    }));
    setTeachers(teacherRows);
    setLoading(false);
  };

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copiado", description: `${label}: ${code}` });
  };

  const institutionName = institution?.name || profile?.institution || "Mi Institución";

  const openAssign = (teacherId: string) => {
    setAssignTeacherId(teacherId);
    setAssignSelected(new Set(assignmentsByTeacher.get(teacherId) || []));
    setAssignOpen(true);
  };

  const saveAssignments = async () => {
    if (!assignTeacherId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !institution?.id) {
      toast({ title: "Error", description: "Sesión o institución no disponible.", variant: "destructive" });
      return;
    }
    const previouslyAssigned = Array.from(assignmentsByTeacher.get(assignTeacherId) || []);
    const selected = Array.from(assignSelected);
    const toUnassign = previouslyAssigned.filter((id) => !assignSelected.has(id));
    const toAssign = selected.filter((id) => !previouslyAssigned.includes(id));

    // Borrar asignaciones removidas
    if (toUnassign.length) {
      const { error: delErr } = await (supabase as any)
        .from("asignaciones")
        .delete()
        .eq("docente_id", assignTeacherId)
        .in("estudiante_id", toUnassign);
      if (delErr) {
        console.error("[asignaciones][delete]", delErr);
        toast({ title: "Error al desasignar", description: delErr.message, variant: "destructive" });
        return;
      }
    }

    // Insertar nuevas asignaciones
    if (toAssign.length) {
      const rows = toAssign.map((estudiante_id) => ({
        estudiante_id,
        docente_id: assignTeacherId,
        institution_id: institution.id,
        creado_por: user.id,
      }));
      const { error: insErr } = await (supabase as any)
        .from("asignaciones")
        .insert(rows);
      if (insErr) {
        console.error("[asignaciones][insert]", insErr);
        toast({ title: "Error al asignar", description: insErr.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: "✓ Estudiante asignado correctamente", description: `${selected.length} estudiante(s) vinculado(s) al docente.` });
    setAssignOpen(false);
    loadData();
  };

  const counts = useMemo(() => {
    let high = 0, medium = 0, low = 0, scoreSum = 0, scored = 0;
    students.forEach((s) => {
      if (s.risk_level === "high") high++;
      else if (s.risk_level === "medium") medium++;
      else if (s.risk_level === "low") low++;
      const score = s.risk_level === "high" ? 80 : s.risk_level === "medium" ? 55 : s.risk_level === "low" ? 25 : null;
      if (score != null) { scoreSum += score; scored++; }
    });
    return { high, medium, low, avg: scored ? Math.round(scoreSum / scored) : 0 };
  }, [students]);

  const recomputeAll = async () => {
    if (!institution?.id) return;
    toast({ title: "Recalculando…", description: "La IA está analizando a tus estudiantes." });
    const { error } = await supabase.functions.invoke("compute-dropout-risk", { body: { institution_id: institution.id } });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Análisis actualizado" });
    loadData();
  };

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header de la Institución */}
          <div className="mb-8">
            <Card className="cloud-card glow-effect">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                      <Building className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gradient">{institutionName}</h1>
                      <p className="text-muted-foreground">Panel de Administración Institucional</p>
                    </div>
                  </div>
                  <Button onClick={recomputeAll} className="gap-2">
                    <Sparkles className="w-4 h-4" /> Recalcular riesgos (IA)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Códigos de vinculación institucional */}
          {institution && (
            <Card className="cloud-card mb-8 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-primary" />
                  Códigos de vinculación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-blue-500/40 bg-blue-500/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-blue-400 font-medium">🔵 Código para Estudiantes</span>
                      <Button size="sm" variant="ghost" onClick={() => copyCode(institution.student_code, "Código estudiantes")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-2xl font-mono font-bold tracking-wider">{institution.student_code}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Comparte este código con tus estudiantes para que se vinculen automáticamente a la institución.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-purple-500/40 bg-purple-500/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-purple-400 font-medium">🟣 Código para Docentes</span>
                      <Button size="sm" variant="ghost" onClick={() => copyCode(institution.teacher_code, "Código docentes")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-2xl font-mono font-bold tracking-wider">{institution.teacher_code}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Comparte este código con los docentes activos para que puedan unirse a la institución.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <InstitutionSummary
            totalStudents={students.length}
            totalTeachers={teachers.length}
            avgRiskScore={counts.avg}
            highRisk={counts.high}
            mediumRisk={counts.medium}
            lowRisk={counts.low}
          />

          {/* Tabs Principales */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full mb-6 h-auto">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Estudiantes
              </TabsTrigger>
              <TabsTrigger value="teachers" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Docentes
              </TabsTrigger>
              <TabsTrigger value="retired" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Jubilados
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Actividades
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Seguimiento IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-6">
              <Card className="cloud-card border-dashed border-yellow-500/40 bg-yellow-500/5">
                <CardContent className="p-3 text-xs font-mono space-y-1">
                  <div>🔍 Buscando usuarios con código: <span className="text-yellow-300">{institution?.student_code ?? "—"}</span> (institution_id: {institution?.id ?? "—"})</div>
                  <div>Estudiantes encontrados: <span className="text-yellow-300">{students.length}</span></div>
                </CardContent>
              </Card>
              <StudentsTable students={students} onOpenDetail={setDetailStudentId} />
            </TabsContent>

            <TabsContent value="teachers" className="space-y-6">
              <Card className="cloud-card border-dashed border-yellow-500/40 bg-yellow-500/5">
                <CardContent className="p-3 text-xs font-mono space-y-1">
                  <div>🔍 Buscando usuarios con código: <span className="text-yellow-300">{institution?.teacher_code ?? "—"}</span> (institution_id: {institution?.id ?? "—"})</div>
                  <div>Docentes encontrados: <span className="text-yellow-300">{teachers.length}</span></div>
                </CardContent>
              </Card>
              <TeachersTable teachers={teachers} onOpenDetail={setDetailTeacherId} />
              <Card className="cloud-card">
                <CardHeader>
                  <CardTitle className="text-base">Asignar estudiantes a docentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-2">
                    {teachers.map((t) => (
                      <Button key={t.id} variant="outline" className="justify-between" onClick={() => openAssign(t.id)}>
                        <span className="truncate">{t.full_name}</span>
                        <UserCheck className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="retired" className="space-y-6">
              <RetiredTeachersTab
                institutionId={institution?.id || null}
                institutionName={institutionName}
                students={studentsRaw.map((s: any) => ({ id: s.id, full_name: s.full_name, grade: s.grade }))}
              />
            </TabsContent>

            <TabsContent value="activities" className="space-y-6">
              <Card className="cloud-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    Actividades institucionales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crea actividades generales y asígnalas a estudiantes de tu institución.
                    Los resultados aparecerán aquí cuando los estudiantes las completen.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="cloud-card text-center p-4">
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-sm text-muted-foreground">Actividades creadas</p>
                    </Card>
                    <Card className="cloud-card text-center p-4">
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-sm text-muted-foreground">En curso</p>
                    </Card>
                    <Card className="cloud-card text-center p-4">
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-sm text-muted-foreground">Completadas</p>
                    </Card>
                  </div>
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Módulo de actividades institucionales en preparación.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <Card className="cloud-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Recomendaciones automáticas (IA)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recs.slice(0, 20).map((r) => {
                      const s = students.find((x) => x.id === r.student_id);
                      return (
                        <div key={r.id} className="p-3 rounded-lg cloud-card">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium">{r.title}</h4>
                              <p className="text-xs text-muted-foreground">Estudiante: {s?.full_name || "—"}</p>
                              <p className="text-sm mt-1">{r.content}</p>
                            </div>
                            <Badge variant={r.priority === "high" ? "destructive" : "secondary"}>{r.priority}</Badge>
                          </div>
                        </div>
                      );
                    })}
                    {recs.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Aún no hay recomendaciones generadas por la IA.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="cloud-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-primary" />
                    Historial de reuniones institucionales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {meetingsList.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg cloud-card">
                        <div>
                          <h4 className="font-medium">{m.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(m.scheduled_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">{m.status}</Badge>
                      </div>
                    ))}
                    {meetingsList.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Sin reuniones registradas todavía.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Assign students dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Asignar estudiantes al docente</DialogTitle>
            <DialogDescription>
              Selecciona los estudiantes que estarán a cargo de este docente. Puedes reasignar en cualquier momento.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80 pr-2">
            <div className="space-y-2">
              {studentsRaw.map((s: any) => {
                const checked = assignSelected.has(s.id);
                let otherTeacherId: string | null = null;
                for (const [tid, set] of assignmentsByTeacher.entries()) {
                  if (tid !== assignTeacherId && set.has(s.id)) { otherTeacherId = tid; break; }
                }
                const otherTeacher = !!otherTeacherId;
                return (
                  <label key={s.id} className="flex items-center gap-3 p-2 rounded cloud-card cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = new Set(assignSelected);
                        if (v) next.add(s.id); else next.delete(s.id);
                        setAssignSelected(next);
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.grade || "—"} {otherTeacher ? "• Reasignar desde otro docente" : ""}
                      </div>
                    </div>
                  </label>
                );
              })}
              {studentsRaw.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No hay estudiantes.</p>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button onClick={saveAssignments}>Guardar asignaciones</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StudentDetailDialog
        studentId={detailStudentId}
        open={!!detailStudentId}
        onOpenChange={(o) => !o && setDetailStudentId(null)}
      />
      <TeacherDetailDialog
        teacherId={detailTeacherId}
        open={!!detailTeacherId}
        onOpenChange={(o) => !o && setDetailTeacherId(null)}
      />
    </div>
  );
};

export default InstitutionDashboard;