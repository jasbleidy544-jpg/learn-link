import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Layout,
  Bot,
  Users,
  Building2,
  ArrowRight,
  AlertTriangle,
  Heart,
  Search,
  Wrench,
  FlaskConical,
  CheckCircle,
  Star,
  Shield,
} from "lucide-react";

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: "01",
      title: "El Estudiante",
      description:
        "Realiza actividades y participa en su proceso de acompañamiento. Es el centro de toda la plataforma.",
      icon: <GraduationCap className="w-8 h-8" />,
      color: "text-blue-400",
      features: [
        "Realiza diagnósticos personalizados",
        "Completa actividades y retos por materia",
        "Recibe recomendaciones de la IA",
        "Chatea con su mentora personal",
      ],
    },
    {
      number: "02",
      title: "La Plataforma",
      description:
        "Organiza la información y permite hacer seguimiento al proceso del estudiante.",
      icon: <Layout className="w-8 h-8" />,
      color: "text-green-400",
      features: [
        "Centraliza los datos del estudiante",
        "Conecta a los distintos actores",
        "Muestra el progreso de forma clara",
        "Facilita la comunicación",
      ],
    },
    {
      number: "03",
      title: "La Inteligencia Artificial",
      description:
        "Analiza la información y apoya la identificación de posibles factores de riesgo.",
      icon: <Bot className="w-8 h-8" />,
      color: "text-purple-400",
      features: [
        "Detecta patrones de riesgo",
        "Genera recomendaciones personalizadas",
        "Analiza el bienestar académico y emocional",
        "Apoya — no reemplaza — al mentor",
      ],
    },
    {
      number: "04",
      title: "Los Docentes y Mentores",
      description:
        "Interpretan las necesidades identificadas y acompañan al estudiante de forma directa.",
      icon: <Users className="w-8 h-8" />,
      color: "text-orange-400",
      features: [
        "Docentes institucionales hacen seguimiento",
        "Mentores jubilados aportan experiencia",
        "Se asignan estudiantes según necesidades",
        "Acompañamiento humano continuo",
      ],
    },
    {
      number: "05",
      title: "La Institución",
      description:
        "Puede hacer seguimiento a los procesos y apoyar las acciones necesarias.",
      icon: <Building2 className="w-8 h-8" />,
      color: "text-amber-400",
      features: [
        "Visión global del estado de sus estudiantes",
        "Asigna docentes y mentores",
        "Consulta reportes y estadísticas",
        "Toma decisiones basadas en datos",
      ],
    },
  ];

  const objetivos = [
    {
      icon: <Search className="w-7 h-7" />,
      titulo: "Comprender el problema",
      desc: "Análisis documental e identificación de causas y factores de deserción.",
    },
    {
      icon: <Wrench className="w-7 h-7" />,
      titulo: "Construir la solución",
      desc: "Desarrollo de LearnLink como plataforma de mentoría mediada por TIC e IA.",
    },
    {
      icon: <FlaskConical className="w-7 h-7" />,
      titulo: "Probar y mejorar",
      desc: "Pruebas y ajustes continuos con el acompañamiento de la Secretaría de Desarrollo Económico.",
    },
  ];

  const benefits = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Prevención temprana",
      description: "Identificamos necesidades antes de que se conviertan en abandono.",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Acompañamiento humano",
      description: "La IA apoya, pero son las personas las que acompañan.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Cinco roles conectados",
      description: "Estudiante, docente, jubilado, institución y IA trabajan juntos.",
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Seguimiento real",
      description: "Visualización clara del progreso de cada estudiante.",
    },
  ];

  return (
    <div className="min-h-screen night-sky">
      <Navbar />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              ¿Cómo <span className="text-gradient">funciona</span> LearnLink?
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Una plataforma para acompañar, no solo para aprender. Estos son los
              cinco pasos que conectan al estudiante con quienes pueden apoyarlo.
            </p>
          </div>

          {/* Process Steps */}
          <div className="space-y-12 mb-20">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div
                  className={`grid lg:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? "lg:grid-flow-col-dense" : ""
                  }`}
                >
                  <div className={`space-y-6 ${index % 2 === 1 ? "lg:col-start-2" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-muted-foreground/30">
                        {step.number}
                      </div>
                      <div className={step.color}>{step.icon}</div>
                    </div>

                    <h2 className="text-3xl font-bold">{step.title}</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>

                    <div className="space-y-3">
                      {step.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={index % 2 === 1 ? "lg:col-start-1" : ""}>
                    <Card
                      className="cloud-card glow-effect p-8 text-center animate-float"
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <div className={`${step.color} mb-6 flex justify-center`}>
                        {step.icon}
                      </div>
                      <div className="text-6xl font-bold text-gradient mb-4">
                        {step.number}
                      </div>
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                    </Card>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:flex justify-center mt-8">
                    <ArrowRight className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Aviso importante */}
          <section className="mb-16">
            <Card className="cloud-card border-l-4 border-accent">
              <CardContent className="p-8 flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Un principio que no negociamos
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    La IA puede generar una alerta, pero el acompañamiento sigue
                    siendo humano. La tecnología no reemplaza al docente ni al
                    mentor: los fortalece.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ¿Qué hay detrás? */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¿Qué hay detrás de <span className="text-gradient">LearnLink</span>?
              </h2>
              <p className="text-xl text-muted-foreground">
                De la investigación a la solución
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {objetivos.map((obj, index) => (
                <Card
                  key={index}
                  className="cloud-card hover:glow-effect transition-all duration-300 animate-float"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-primary mb-4 flex justify-center">
                      {obj.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{obj.titulo}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {obj.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Benefits */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                ¿Por qué <span className="text-gradient">LearnLink</span>?
              </h2>
              <p className="text-xl text-muted-foreground">
                Un enfoque centrado en la persona, no en la herramienta
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="cloud-card text-center hover:glow-effect transition-all duration-300 animate-float"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="text-primary mb-4 flex justify-center">
                      {benefit.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <Card className="cloud-card glow-effect">
              <CardContent className="p-12">
                <Star className="w-16 h-16 text-accent mx-auto mb-6 animate-pulse" />
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Comienza tu <span className="text-gradient">diagnóstico</span> hoy
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  El primer paso del acompañamiento es conocerte. Es gratis,
                  personalizado y toma pocos minutos.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 glow-effect"
                    onClick={() => navigate("/register/student")}
                  >
                    Comenzar gratis
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-6"
                    onClick={() => navigate("/about")}
                  >
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

export default HowItWorks;