import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Target,
  Users,
  Star,
  Lightbulb,
  Search,
  Wrench,
  FlaskConical,
  GraduationCap,
  MapPin,
  UserCircle2,
} from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Empatía",
      description:
        "Comprendemos las necesidades únicas de cada estudiante y los desafíos que enfrenta.",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Prevención",
      description:
        "Creemos que es mejor acompañar antes de que ocurra el abandono, que remediarlo después.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Colaboración",
      description:
        "Unimos a estudiantes, docentes, mentores jubilados e instituciones alrededor del estudiante.",
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "Innovación con propósito",
      description:
        "La tecnología no es el fin: es el medio para fortalecer el acompañamiento humano.",
    },
  ];

  const objetivos = [
    {
      icon: <Search className="w-7 h-7" />,
      label: "Objetivo 1",
      title: "Comprender el problema",
      description:
        "Culminamos el análisis documental e identificamos las principales causas y factores relacionados con la deserción escolar.",
      estado: "✓ Completado",
    },
    {
      icon: <Wrench className="w-7 h-7" />,
      label: "Objetivo 2",
      title: "Construir la solución",
      description:
        "Desarrollamos LearnLink, una plataforma de mentoría mediada por TIC e IA, actualmente en proceso de ajuste para su versión final.",
      estado: "🔄 En curso",
    },
    {
      icon: <FlaskConical className="w-7 h-7" />,
      label: "Objetivo 3",
      title: "Probar y mejorar",
      description:
        "Trabajamos con la Secretaría de Desarrollo Económico y con el acompañamiento de un ingeniero para perfeccionar la plataforma y la IA.",
      estado: "🔄 En curso",
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
              Sobre <span className="text-gradient">LearnLink</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Nacimos de la convicción de que cada estudiante merece ser acompañado
              antes de que llegue al punto de abandonar. Somos estudiantes
              investigadores que buscamos transformar una problemática educativa
              en una oportunidad de acompañamiento.
            </p>
          </div>

          {/* ¿Quiénes somos? */}
          <section className="mb-16">
            <Card className="cloud-card glow-effect">
              <CardContent className="p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <UserCircle2 className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-bold">¿Quiénes somos?</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Somos un equipo de estudiantes investigadores que busca
                      transformar una problemática educativa en una oportunidad de
                      acompañamiento. Nuestro interés nace de preguntarnos qué
                      puede hacer que un estudiante deje de estudiar, y entender
                      que la respuesta casi nunca es una sola.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Grado 11</p>
                        <p className="text-sm text-muted-foreground">
                          IED Nicolás Buenaventura
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Santa Marta, Colombia</p>
                        <p className="text-sm text-muted-foreground">
                          Área de investigación: Educación
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Ponentes</p>
                        <p className="text-sm text-muted-foreground">
                          Jasbleidy Maleja Ramos Arrieta
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Diego Adrián López Bean
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-border/40 text-center">
                  <p className="text-2xl md:text-3xl font-bold italic text-gradient">
                    "La tecnología orienta.
                    <br />
                    Las personas acompañan."
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Misión y Visión */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <Card className="cloud-card glow-effect">
              <CardContent className="p-8">
                <div className="text-accent mb-4">
                  <Target className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Nuestra Misión</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Fortalecer el acompañamiento académico y la permanencia escolar
                  mediante una plataforma de mentoría mediada por TIC e
                  Inteligencia Artificial, que permita identificar necesidades y
                  conectar a los actores que pueden apoyar al estudiante.
                </p>
              </CardContent>
            </Card>

            <Card className="cloud-card glow-effect">
              <CardContent className="p-8">
                <div className="text-primary mb-4">
                  <Star className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Nuestra Visión</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Contribuir a reducir los índices de deserción escolar en básica
                  secundaria y educación media, demostrando que la tecnología
                  puede fortalecer (no reemplazar) el acompañamiento humano.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Objetivos */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                De la investigación a la <span className="text-gradient">solución</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Nuestro proyecto se construye en tres objetivos conectados
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {objetivos.map((obj, i) => (
                <Card
                  key={i}
                  className="cloud-card hover:glow-effect transition-all duration-300 animate-float"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="text-primary mb-3">{obj.icon}</div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      {obj.label}
                    </p>
                    <h3 className="text-lg font-semibold mb-2">{obj.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {obj.description}
                    </p>
                    <span className="text-xs font-medium">{obj.estado}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Valores */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Nuestros <span className="text-gradient">Valores</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Los principios que guían nuestro trabajo
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card
                  key={index}
                  className="cloud-card hover:glow-effect transition-all duration-300 animate-float"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-primary mb-4 flex justify-center">
                      {value.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{value.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {value.description}
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
                  ¿Quieres saber <span className="text-gradient">cómo funciona</span>?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Descubre paso a paso cómo LearnLink acompaña a los estudiantes
                  durante todo su proceso.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 glow-effect"
                    onClick={() => navigate("/how-it-works")}
                  >
                    Ver cómo funciona
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-6"
                    onClick={() => navigate("/pricing")}
                  >
                    Ver planes
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

export default About;