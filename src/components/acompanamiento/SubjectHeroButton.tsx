import { Sparkles, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SubjectHeroButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/acompanamiento-digital")}
      className="group w-full text-left rounded-2xl p-6 border border-primary/40 bg-gradient-to-br from-primary/30 via-primary/20 to-accent/20 hover:from-primary/40 hover:via-primary/30 hover:to-accent/30 transition-all shadow-lg hover:shadow-xl"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/30 flex items-center justify-center shrink-0">
          <Brain className="w-7 h-7 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            Mi Acompañamiento Digital <Sparkles className="w-5 h-5 text-accent" />
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tu camino personalizado de aprendizaje en cada materia.
          </p>
        </div>
        <div className="hidden sm:flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform">
          Empezar →
        </div>
      </div>
    </button>
  );
}