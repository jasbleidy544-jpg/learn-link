import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-night-education.jpg";
import {
  Shield,
  Sparkles,
  GraduationCap,
  Heart,
  Users,
  UserCheck,
  Building2,
  Bot,
  Crown,
  Search,
  Compass,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  HandHeart,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const roles = [
    { icon: <GraduationCap className="w-7 h-7" />, title: "Estudiante", desc: "Centro del proceso. Aprende, participa y recibe acompañamiento personalizado." },
    { icon: <Users className="w-7 h-7" />, title: "Docente institucional", desc: "Acompaña desde la institución y hace seguimiento al proceso del estudiante." },
    { icon: <Heart className="w-7 h-7" />, title: "Docente jubilado voluntario", desc: "Aporta su experiencia como mentor y guía a los estudiantes que lo necesitan." },
    { icon: <Building2 className="w-7 h-7" />, title: "Institución educativa", desc: "Obtiene una visión amplia para fortalecer el seguimiento institucional." },
    { icon: <Bot className="w-7 h-7" />, title: "Inteligencia Artificial", desc: "Analiza información y apoya la identificación temprana de factores de riesgo." },
    { icon: <Crown className="w-7 h-7" />, title: "Super administrador", desc: "Supervisa el funcionamiento global de la plataforma y sus componentes." },
  ];

  const pasos = [
    { icon: <Search className="w-7 h-7" />, title: "Detectar", desc: "Identificamos necesidades y posibles factores de riesgo." },
    { icon: <HandHeart className="w-7 h-7" />, title: "Acompañar", desc: "Conectamos al estudiante con quienes pueden apoyarlo." },
    { icon: <Compass className="w-7 h-7" />, title: "Orientar", desc: "Guiar el proceso con un camino claro y personalizado." },
    { icon: <TrendingUp className="w-7 h-7" />, title: "Hacer seguimiento", desc: "Observar avances y ajustar lo necesario." },
    { icon: <CheckCircle className="w-7 h-7" />, title: "Actuar", desc: "Convertir la información en acciones concretas." },
  ];

  return (
    <div className="min-h-screen night-sky">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 relative">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background/80" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="animate-float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full cloud-card mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">
                Mentoría + Tecnología + Inteligencia Artificial
              </span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gradient">Learn</span>
            <span className="text-foreground">Link</span>
          </h1>

          <p className="text-xl md:text-2xl text-foreground/90 font-medium mb-3">
            Acompañar para permanecer.
          </p>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Una plataforma digital creada para fortalecer el acompañamiento académico
            y contribuir a la permanencia escolar.
          </p>

          <div className="inline-block p-4 rounded-2xl cloud-card mb-8 max-w-2xl">
            <p className="text-base md:text-lg text-foreground italic">
              "¿Y si pudiéramos acompañar a un estudiante <strong>antes</strong> de que abandone?"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="text-lg px-8 py-6 glow-effect"
              onClick={() => navigate("/register/student")}
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              Comenzar Diagnóstico
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/how-it-works")}
            >
              Conocer más
            </Button>
          </div>
        </div>
      </section>

      {/* ¿Qué es LearnLink? */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <Card className="cloud-card glow-effect">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿Qué es <span className="text-gradient">LearnLink</span>?
              </h2>
              <p className="text-xl text-primary font-medium mb-4">
                Una plataforma para acompañar, no solo para aprender.
              </p>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                LearnLink es una solución web de mentoría mediada por TIC e
                Inteligencia Artificial, diseñada para fortalecer el acompañamiento
                académico y la orientación estudiantil. Integra en un mismo entorno
                a estudiantes, docentes, mentores jubilados, instituciones e IA.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Los 6 roles */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Los <span className="text-gradient">actores</span> de LearnLink
            </h2>
            <p className="text-xl text-muted-foreground">
              Todos conectados alrededor del estudiante
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role, index) => (
              <Card
                key={index}
                className="cloud-card hover:glow-effect transition-all duration-300 animate-float"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <CardContent className="p-6">
                  <div className="text-primary mb-4">{role.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{role.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {role.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ¿Qué buscamos? */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Qué <span className="text-gradient">buscamos</span>?
            </h2>
            <p className="text-xl text-muted-foreground">
              Un ciclo de acompañamiento que no deja al estudiante solo
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {pasos.map((paso, index) => (
              <Card
                key={index}
                className="cloud-card text-center hover:glow-effect transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="text-primary mb-3 flex justify-center">
                    {paso.icon}
                  </div>
                  <h3 className="text-base font-semibold mb-2">{paso.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {paso.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Frase */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="cloud-card glow-effect">
            <CardContent className="p-10">
              <p className="text-2xl md:text-3xl font-bold italic text-gradient">
                "La tecnología orienta.
                <br />
                Las personas acompañan."
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <Card className="cloud-card glow-effect">
            <CardContent className="p-10 md:p-12 text-center">
              <ArrowRight className="w-12 h-12 text-accent mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Conoce más sobre <span className="text-gradient">LearnLink</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Descubre cómo funciona, quiénes somos y qué hay detrás de esta
                investigación que busca transformar el acompañamiento estudiantil.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 glow-effect"
                  onClick={() => navigate("/how-it-works")}
                >
                  Cómo funciona
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6"
                  onClick={() => navigate("/about")}
                >
                  Sobre nosotros
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Admin Link */}
      <div className="text-center pb-8">
        <button
          onClick={() => navigate("/admin-login")}
          className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 opacity-70 hover:opacity-100"
        >
          <Shield className="w-3 h-3" />
          Iniciar sesión como Administrador General
        </button>
      </div>
    </div>
  );
};

export default Index;