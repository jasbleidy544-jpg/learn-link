import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Star,
  Heart,
  BookOpen,
  Shield
} from "lucide-react";

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: "01",
      title: "Diagnóstico Integral",
      description: "El estudiante responde preguntas sobre aspectos académicos, sociales y emocionales",
      icon: <Brain className="w-8 h-8" />,
      color: "text-accent",
      features: [
        "Evaluación académica personalizada",
        "Análisis del bienestar emocional", 
        "Identificación de redes de apoyo",
        "Detección temprana de riesgos"
      ]
    },
    {
      number: "02", 
      title: "Análisis Inteligente",
      description: "Nuestra IA procesa las respuestas y genera un perfil completo del estudiante",
      icon: <Target className="w-8 h-8" />,
      color: "text-primary",
      features: [
        "Algoritmos de predicción avanzados",
        "Identificación de patrones de riesgo",
        "Clasificación por niveles de urgencia",
        "Recomendaciones personalizadas"
      ]
    },
    {
      number: "03",
      title: "Plan de Apoyo",
      description: "Se crea un plan personalizado con actividades, recursos y seguimiento",
      icon: <BookOpen className="w-8 h-8" />,
      color: "text-light-blue",
      features: [
        "Actividades adaptadas al perfil",
        "Recursos educativos específicos",
        "Cronograma de intervenciones",
        "Métricas de seguimiento"
      ]
    },
    {
      number: "04",
      title: "Seguimiento Continuo",
      description: "Monitoreo constante del progreso con ajustes en tiempo real",
      icon: <TrendingUp className="w-8 h-8" />,
      color: "text-star-glow",
      features: [
        "Dashboard de progreso visual",
        "Alertas automáticas",
        "Reportes periódicos",
        "Intervenciones oportunas"
      ]
    }
  ];

  const benefits = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Prevención Efectiva",
      description: "Reduce hasta un 85% el riesgo de deserción escolar"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Bienestar Integral",
      description: "Atiende aspectos académicos, sociales y emocionales"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Colaboración",
      description: "Conecta estudiantes, maestros e instituciones"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Resultados Medibles",
      description: "Seguimiento de indicadores clave de éxito"
    }
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
              Nuestra metodología científica combina inteligencia artificial, psicología educativa 
              y seguimiento personalizado para prevenir la deserción escolar
            </p>
          </div>

          {/* Process Steps */}
          <div className="space-y-16 mb-20">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                  {/* Content */}
                  <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-muted-foreground/30">
                        {step.number}
                      </div>
                      <div className={step.color}>
                        {step.icon}
                      </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold">{step.title}</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    
                    <div className="space-y-3">
                      {step.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual */}
                  <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                    <Card className="cloud-card glow-effect p-8 text-center animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                      <div className={`${step.color} mb-6`}>
                        {step.icon}
                      </div>
                      <div className="text-6xl font-bold text-gradient mb-4">
                        {step.number}
                      </div>
                      <h3 className="text-xl font-semibold">
                        {step.title}
                      </h3>
                    </Card>
                  </div>
                </div>

                {/* Connection Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex justify-center mt-12">
                    <ArrowRight className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                ¿Por qué <span className="text-gradient">LearnLink</span>?
              </h2>
              <p className="text-xl text-muted-foreground">
                Beneficios comprobados para estudiantes e instituciones
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="cloud-card text-center hover:glow-effect transition-all duration-300 animate-float" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="text-primary mb-4">
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

          {/* CTA Section */}
          <section className="text-center">
            <Card className="cloud-card glow-effect">
              <CardContent className="p-12">
                <Star className="w-16 h-16 text-accent mx-auto mb-6 animate-pulse" />
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Comienza la <span className="text-gradient">transformación</span> hoy
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Únete a las miles de instituciones que ya están usando LearnLink 
                  para prevenir la deserción escolar y mejorar el bienestar estudiantil
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 glow-effect"
                    onClick={() => navigate('/register/student')}
                  >
                    Diagnóstico Gratuito
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-lg px-8 py-6"
                    onClick={() => navigate('/pricing')}
                  >
                    Ver Planes Institucionales
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