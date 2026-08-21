import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import { GraduationCap, Users, Building, LogIn, UserPlus, ArrowLeft, Star, HeartHandshake, BookOpenCheck } from "lucide-react";

type Action = "login" | "register" | null;

const ROLES = [
  { key: "student", label: "Estudiante", icon: GraduationCap, desc: "Accede a diagnósticos, retos y tu mentor IA" },
  { key: "teacher", label: "Docente", icon: Users, desc: "Acompaña y apoya a tus estudiantes" },
  { key: "institution", label: "Institución", icon: Building, desc: "Gestiona el bienestar estudiantil" },
];

const Access = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = params.get("action") as Action;
  const [action, setAction] = useState<Action>(initial === "login" || initial === "register" ? initial : null);
  const [teacherModal, setTeacherModal] = useState(false);

  const selectRole = (role: string) => {
    if (role === "teacher") { setTeacherModal(true); return; }
    if (action === "login") navigate(`/login?role=${role}`);
    else navigate(`/register/${role}`);
  };

  const pickTeacherType = (type: "active" | "retired") => {
    setTeacherModal(false);
    if (action === "login") navigate(`/login?role=teacher&teacher_type=${type}`);
    else navigate(`/register/teacher?type=${type}`);
  };

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="cloud-card glow-effect">
            <CardHeader className="text-center">
              <div className="text-primary mb-4">
                <Star className="w-12 h-12 mx-auto animate-pulse" />
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold mb-2">
                {action === null && "Bienvenido a LearnLink"}
                {action === "login" && "Iniciar sesión"}
                {action === "register" && "Crear cuenta nueva"}
              </CardTitle>
              <p className="text-muted-foreground">
                {action === null && "¿Qué deseas hacer hoy?"}
                {action !== null && "Selecciona tu tipo de perfil"}
              </p>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              {action === null ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setAction("login")}
                    className="cloud-card hover:glow-effect transition-all duration-300 p-8 rounded-lg text-left group"
                  >
                    <LogIn className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold mb-2">Iniciar sesión</h3>
                    <p className="text-sm text-muted-foreground">Ya tengo una cuenta y quiero entrar</p>
                  </button>
                  <button
                    onClick={() => setAction("register")}
                    className="cloud-card hover:glow-effect transition-all duration-300 p-8 rounded-lg text-left group"
                  >
                    <UserPlus className="w-10 h-10 text-accent mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold mb-2">Crear cuenta nueva</h3>
                    <p className="text-sm text-muted-foreground">Soy nuevo y quiero registrarme</p>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    {ROLES.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => selectRole(r.key)}
                        className="cloud-card hover:glow-effect transition-all duration-300 p-6 rounded-lg text-center group"
                      >
                        <r.icon className="w-10 h-10 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg font-semibold mb-1">{r.label}</h3>
                        <p className="text-xs text-muted-foreground">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center pt-2">
                    <Button variant="ghost" onClick={() => setAction(null)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={teacherModal} onOpenChange={setTeacherModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Qué tipo de docente eres?</DialogTitle>
            <DialogDescription>Selecciona tu perfil para llevarte al panel correcto.</DialogDescription>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => pickTeacherType("retired")}
              className="cloud-card hover:glow-effect transition-all duration-300 p-6 rounded-lg text-left group"
            >
              <HeartHandshake className="w-10 h-10 text-pink-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-1">👴 Docente Voluntario Jubilado</h3>
              <p className="text-xs text-muted-foreground">Acompañas a estudiantes asignados con experiencia y mentoría.</p>
            </button>
            <button
              onClick={() => pickTeacherType("active")}
              className="cloud-card hover:glow-effect transition-all duration-300 p-6 rounded-lg text-left group"
            >
              <BookOpenCheck className="w-10 h-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-1">👨‍🏫 Docente Activo Voluntario</h3>
              <p className="text-xs text-muted-foreground">Creas actividades y haces seguimiento a tus estudiantes asignados.</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Access;
