import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Award, Trophy, Star, Flame, BookOpen, Users, Heart, Target, Brain, Medal } from "lucide-react";
import { useGamification, levelFromXp, LEVELS } from "@/hooks/useGamification";

const AchievementsDialog = () => {
  const { data } = useGamification();
  const xp = data?.xp ?? 0;
  const levelIdx = LEVELS.findIndex((l) => l.name === (data?.level_name ?? "Explorador"));
  const level = levelIdx + 1;
  const streak = (data as any)?.streak_days ?? 0;

  const achievements = [
    { icon: Star, title: "Primer paso", desc: "Te registraste en LearnLink", unlocked: true, category: "Inicio" },
    { icon: Flame, title: "Racha de 3 días", desc: "Conectado 3 días seguidos", unlocked: streak >= 3, category: "Constancia" },
    { icon: BookOpen, title: "Estudiante curioso", desc: "Completaste tu primer reto", unlocked: xp >= 10, category: "Académico" },
    { icon: Brain, title: "Pensador crítico", desc: "Alcanza 100 XP", unlocked: xp >= 100, category: "Académico" },
    { icon: Trophy, title: "Nivel 2", desc: "Sube al nivel 2", unlocked: level >= 2, category: "Progreso" },
    { icon: Medal, title: "Nivel 5", desc: "Sube al nivel 5", unlocked: level >= 5, category: "Progreso" },
    { icon: Users, title: "Equipo unido", desc: "Completa actividad social", unlocked: false, category: "Social" },
    { icon: Heart, title: "Bienestar", desc: "Completa actividad emocional", unlocked: false, category: "Emocional" },
    { icon: Target, title: "Meta cumplida", desc: "Termina un diagnóstico", unlocked: false, category: "Diagnóstico" },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
          <Award className="w-6 h-6" /> Mis Logros
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Mis Logros</DialogTitle>
          <DialogDescription>Tu progreso y reconocimientos en LearnLink</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((a, i) => {
            const Icon = a.icon;
            return (
              <Card key={i} className={`p-4 flex items-start gap-3 ${a.unlocked ? "border-primary/40" : "opacity-50"}`}>
                <div className={`p-2 rounded-lg ${a.unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{a.title}</h4>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{a.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                  <p className="text-[11px] mt-1 font-medium">{a.unlocked ? "✅ Desbloqueado" : "🔒 Bloqueado"}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AchievementsDialog;