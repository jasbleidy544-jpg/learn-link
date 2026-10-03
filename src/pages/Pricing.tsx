import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Sparkles,
  GraduationCap,
  Building2,
  Users,
  Clock,
  Send,
  Star,
  CheckCircle,
} from "lucide-react";

const Pricing = () => {
  const navigate = useNavigate();

  const beneficiosEstudiantes = [
    "Diagnóstico personalizado con IA",
    "Actividades adaptadas a tu nivel",
    "Chat con tu mentora personal",
    "Seguimiento de tu progreso",
    "Recomendaciones personalizadas",
  ];

  const beneficiosInstituciones = [
    "Panel completo de administración",
    "Seguimiento de estudiantes y docentes",
    "Asignación de mentores jubilados",
    "Reportes y estadísticas",
    "Integración con IA para detección de riesgo",
  ];

  return (
    <div className="min-h-screen night-sky">
      <Navbar />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full cloud-card mb-6">
              <Clock className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-sm font-medium">Muy pronto</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Planes <span className="text-gradient">en proceso</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Estamos trabajando en los planes institucionales. Mientras tanto,
              los estudiantes siempre tienen acceso gratuito a la plataforma.
            </p>

            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full cloud-card text-green-400">
              <Heart className="w-5 h-5" />
              <span className="font-medium">
                Estudiantes acceden gratis, siempre
              </span>
            </div>
          </div>

          {/* Dos tarjetas: Estudiantes e Instituciones */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
            {/* Estudiante */}
            <Card className="cloud-card glow-effect animate-float">
              <CardHeader className="text-center pb-6">
                <div className="text-accent mb-4 flex justify-center">
                  <GraduationCap className="w-10 h-10" />
                </div>
                <Badge variant="secondary" className="mx-auto mb-3">
                  Disponible ahora
                </Badge>
                <CardTitle className="text-2xl font-bold mb-2">
                  Para Estudiantes
                </CardTitle>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gradient">Gratis</span>
                  <span className="text-muted-foreground"> siempre</span>
                </div>
                <p className="text-muted-foreground">
                  Todo lo que necesitas para tu proceso de acompañamiento
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {beneficiosEstudiantes.map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-sm">{f}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full glow-effect"
                  size="lg"
                  onClick={() => navigate("/register/student")}
                >
                  Comenzar ahora
                </Button>
              </CardContent>
            </Card>

            {/* Institución */}
            <Card className="cloud-card relative ring-2 ring-primary/40 animate-float" style={{ animationDelay: "0.15s" }}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Muy pronto
                </div>
              </div>

              <CardHeader className="text-center pb-6 pt-8">
                <div className="text-primary mb-4 flex justify-center">
                  <Building2 className="w-10 h-10" />
                </div>
                <Badge variant="outline" className="mx-auto mb-3 border-accent text-accent">
                  En desarrollo
                </Badge>
                <CardTitle className="text-2xl font-bold mb-2">
                  Para Instituciones
                </CardTitle>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gradient">
                    Próximamente
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Estamos afinando los planes para tu institución
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 opacity-80">
                  {beneficiosInstituciones.map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{f}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  size="lg"
                  disabled
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Disponible muy pronto
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Info sobre el proceso */}
          <section className="mb-16">
            <Card className="cloud-card">
              <CardContent className="p-8 md:p-12 text-center">
                <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  ¿Por qué están <span className="text-gradient">en proceso</span>?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
                  LearnLink está en fase de prueba y ajuste. Actualmente trabajamos
                  con la Secretaría de Desarrollo Económico y con el acompañamiento
                  de un ingeniero para perfeccionar la plataforma y los componentes
                  de Inteligencia Artificial antes de la versión final.
                </p>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Los planes institucionales se definirán cuando la plataforma
                  complete su proceso de validación. Mientras tanto, los
                  estudiantes pueden usar todas las funcionalidades de forma
                  gratuita.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* CTA Instituciones */}
          <section className="mb-12">
            <Card className="cloud-card glow-effect">
              <CardContent className="p-8 text-center">
                <Building2 className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-3">
                  ¿Eres una institución educativa?
                </h3>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Si quieres hacer parte del proceso de prueba y validación de
                  LearnLink, escríbenos y te contamos cómo participar.
                </p>
                <Button
                  size="lg"
                  className="glow-effect"
                  onClick={() => {
                    window.location.href =
                      "mailto:learnlink1.0@gmail.com?subject=Quiero conocer LearnLink para mi institución";
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Contactar al equipo
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* FAQ */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Preguntas <span className="text-gradient">frecuentes</span>
              </h2>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="cloud-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">
                    ¿Los estudiantes deben pagar por usar LearnLink?
                  </h3>
                  <p className="text-muted-foreground">
                    No. Los estudiantes siempre tendrán acceso gratuito a las
                    funcionalidades de diagnóstico, acompañamiento y seguimiento.
                    LearnLink nació para ellos.
                  </p>
                </CardContent>
              </Card>

              <Card className="cloud-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">
                    ¿Cuándo estarán disponibles los planes institucionales?
                  </h3>
                  <p className="text-muted-foreground">
                    Estamos en proceso de validación con usuarios reales. Cuando la
                    plataforma complete su fase de pruebas, publicaremos los planes
                    definitivos. Si quieres ser de las primeras instituciones en
                    conocerlos, escríbenos.
                  </p>
                </CardContent>
              </Card>

              <Card className="cloud-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">
                    ¿Qué diferencia a LearnLink de otras plataformas?
                  </h3>
                  <p className="text-muted-foreground">
                    LearnLink no es solamente una plataforma de contenidos. Está
                    centrada en el acompañamiento y en la permanencia del
                    estudiante. Integra cinco actores alrededor del estudiante y
                    pone la tecnología al servicio de las personas.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA Final */}
          <section className="text-center">
            <Card className="cloud-card glow-effect">
              <CardContent className="p-12">
                <Star className="w-16 h-16 text-accent mx-auto mb-6 animate-pulse" />
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Mientras tanto, <span className="text-gradient">empieza gratis</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  El diagnóstico y el acompañamiento están disponibles ahora mismo
                  para estudiantes. No esperes más para comenzar.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 glow-effect"
                    onClick={() => navigate("/register/student")}
                  >
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Soy estudiante
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-6"
                    onClick={() => navigate("/about")}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Conocer al equipo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Pricing;