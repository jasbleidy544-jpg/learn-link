import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-night-education.jpg";
import { 
  Shield, 
  Sparkles,
  GraduationCap
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 relative">
        {/* Hero Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background/80" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="animate-float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full cloud-card mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Combatiendo la deserción escolar</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gradient">Learn</span>
            <span className="text-foreground">Link</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Plataforma inteligente que identifica y previene la deserción escolar 
            mediante diagnósticos personalizados y planes de apoyo integral
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 glow-effect"
              onClick={() => navigate('/register/student')}
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              Comenzar Diagnóstico
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate('/how-it-works')}
            >
              Conocer más
            </Button>
          </div>
        </div>
      </section>

      <div className="text-center pb-8">
        <button
          onClick={() => navigate('/admin-login')}
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
