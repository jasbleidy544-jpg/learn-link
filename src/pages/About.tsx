import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Heart, 
  Target, 
  Users, 
  Star,
  Lightbulb
} from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Empatía",
      description: "Comprendemos las necesidades únicas de cada estudiante y las desafíos que enfrentan"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Prevención",
      description: "Creemos que es mejor prevenir la deserción que remediarla después"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Colaboración",
      description: "Unimos a estudiantes, maestros e instituciones para crear redes de apoyo sólidas"
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "Innovación",
      description: "Utilizamos tecnología de punta para crear soluciones educativas efectivas"
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
              Sobre <span className="text-gradient">LearnLink</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Nacimos de la convicción de que cada estudiante merece la oportunidad de alcanzar su máximo potencial. 
              Utilizamos tecnología e inteligencia artificial para crear un futuro donde la deserción escolar sea cosa del pasado.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <Card className="cloud-card glow-effect">
              <CardContent className="p-8">
                <div className="text-accent mb-4">
                  <Target className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Nuestra Misión</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Prevenir la deserción escolar mediante la identificación temprana de riesgos académicos, 
                  sociales y emocionales, ofreciendo planes de apoyo personalizados que fortalezcan 
                  la permanencia y el éxito estudiantil.
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
                  Ser la plataforma líder en América Latina para la prevención de la deserción escolar, 
                  transformando la educación mediante inteligencia artificial y creando oportunidades 
                  equitativas para todos los estudiantes.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Values */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Nuestros <span className="text-gradient">Valores</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Los principios que guían nuestro trabajo diario
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="cloud-card hover:glow-effect transition-all duration-300 animate-float" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6 text-center">
                    <div className="text-primary mb-4">
                      {value.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-3">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>


          {/* Stats Impact */}
          <section className="mb-16">
            <Card className="cloud-card glow-effect">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl font-bold mb-8">
                  Nuestro <span className="text-gradient">Impacto</span>
                </h2>
                <div className="grid md:grid-cols-4 gap-8">
                  <div>
                    <div className="text-4xl font-bold text-gradient mb-2">85%</div>
                    <p className="text-muted-foreground">Reducción en deserción</p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-gradient mb-2">10,000+</div>
                    <p className="text-muted-foreground">Estudiantes impactados</p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-gradient mb-2">500+</div>
                    <p className="text-muted-foreground">Instituciones aliadas</p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-gradient mb-2">15</div>
                    <p className="text-muted-foreground">Países en América Latina</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA */}
          <section className="text-center">
            <Card className="cloud-card glow-effect">
              <CardContent className="p-12">
                <Star className="w-16 h-16 text-accent mx-auto mb-6 animate-pulse" />
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Únete a la <span className="text-gradient">revolución</span> educativa
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Sé parte del cambio que está transformando la educación en América Latina. 
                  Juntos podemos crear un futuro donde cada estudiante alcance su máximo potencial.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 glow-effect"
                    onClick={() => navigate('/register/student')}
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    Comenzar Diagnóstico
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

export default About;