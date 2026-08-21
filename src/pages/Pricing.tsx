import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Check, 
  Star, 
  Building, 
  Users, 
  TrendingUp, 
  Shield,
  Crown,
  Sparkles,
  Heart
} from "lucide-react";

const Pricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Básico",
      price: "$299",
      period: "/mes",
      description: "Perfecto para instituciones pequeñas",
      icon: <Building className="w-8 h-8" />,
      color: "text-light-blue",
      students: "Hasta 500 estudiantes",
      popular: false,
      features: [
        "Diagnósticos ilimitados",
        "Planes de apoyo automáticos", 
        "Dashboard básico",
        "Reportes mensuales",
        "Soporte por email",
        "Capacitación inicial"
      ]
    },
    {
      name: "Profesional",
      price: "$599",
      period: "/mes", 
      description: "Ideal para colegios medianos",
      icon: <Users className="w-8 h-8" />,
      color: "text-primary",
      students: "Hasta 1,500 estudiantes",
      popular: true,
      features: [
        "Todo lo del plan Básico",
        "Analytics avanzados",
        "Alertas en tiempo real",
        "Integración con SIS",
        "Reportes personalizados",
        "Soporte prioritario",
        "Capacitación continua",
        "API personalizada"
      ]
    },
    {
      name: "Enterprise",
      price: "Personalizado",
      period: "",
      description: "Para grandes instituciones",
      icon: <Crown className="w-8 h-8" />,
      color: "text-accent",
      students: "Estudiantes ilimitados",
      popular: false,
      features: [
        "Todo lo del plan Profesional", 
        "Implementación personalizada",
        "Manager de cuenta dedicado",
        "SLA garantizado",
        "Integración completa",
        "Consultoría especializada",
        "Soporte 24/7",
        "Desarrollo a medida"
      ]
    }
  ];

  const additionalServices = [
    {
      title: "Capacitación Especializada",
      description: "Talleres para maestros y administrativos",
      price: "$1,200",
      icon: <Star className="w-6 h-6" />
    },
    {
      title: "Consultoría Pedagógica", 
      description: "Asesoría experta en retención estudiantil",
      price: "$2,500",
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      title: "Integración Personalizada",
      description: "Conecta con tus sistemas existentes",
      price: "$3,800",
      icon: <Shield className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full cloud-card mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Planes para Instituciones</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Invierte en el <span className="text-gradient">futuro</span> de tus estudiantes
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Planes flexibles diseñados para instituciones educativas de todos los tamaños. 
              Los estudiantes siempre tienen acceso gratuito.
            </p>
            
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full cloud-card text-green-400">
              <Heart className="w-5 h-5" />
              <span className="font-medium">Estudiantes acceden gratis siempre</span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <Card key={index} className={`cloud-card relative ${plan.popular ? 'glow-effect ring-2 ring-primary' : ''} animate-float`} style={{ animationDelay: `${index * 0.1}s` }}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Más Popular
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className={`${plan.color} mb-4`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    {plan.name}
                  </CardTitle>
                  <p className="text-muted-foreground mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gradient">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {plan.students}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className={`w-full ${plan.popular ? 'glow-effect' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => navigate('/register/institution')}
                  >
                    {plan.name === 'Enterprise' ? 'Contactar Ventas' : 'Comenzar Prueba'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Services */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Servicios <span className="text-gradient">Adicionales</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Potencia tu implementación con servicios especializados
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {additionalServices.map((service, index) => (
                <Card key={index} className="cloud-card hover:glow-effect transition-all duration-300 animate-float" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6 text-center">
                    <div className="text-primary mb-4">
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {service.description}
                    </p>
                    <div className="text-2xl font-bold text-gradient mb-4">
                      {service.price}
                    </div>
                    <Button variant="outline" className="w-full">
                      Más Información
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Preguntas <span className="text-gradient">Frecuentes</span>
              </h2>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="cloud-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">
                    ¿Los estudiantes deben pagar por usar LearnLink?
                  </h3>
                  <p className="text-muted-foreground">
                    No, los estudiantes siempre tienen acceso gratuito a todas las funcionalidades de diagnóstico y seguimiento. Solo las instituciones pagan por la gestión administrativa y análisis avanzados.
                  </p>
                </CardContent>
              </Card>

              <Card className="cloud-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">
                    ¿Puedo cambiar de plan en cualquier momento?
                  </h3>
                  <p className="text-muted-foreground">
                    Sí, puedes actualizar o reducir tu plan cuando necesites. Los cambios se aplican en el siguiente ciclo de facturación.
                  </p>
                </CardContent>
              </Card>

              <Card className="cloud-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">
                    ¿Ofrecen descuentos para múltiples instituciones?
                  </h3>
                  <p className="text-muted-foreground">
                    Sí, ofrecemos descuentos especiales para redes educativas, distritos escolares y organizaciones con múltiples instituciones. Contáctanos para una cotización personalizada.
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
                  ¿Listo para <span className="text-gradient">transformar</span> tu institución?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Únete a las 500+ instituciones que ya previenen la deserción escolar con LearnLink
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 glow-effect"
                    onClick={() => navigate('/register/institution')}
                  >
                    Comenzar Prueba Gratuita
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-lg px-8 py-6"
                  >
                    Agendar Demo
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