import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Trophy, TrendingUp, Flame } from "lucide-react";
import EvolvingAvatar from "./EvolvingAvatar";
import { useGamification } from "@/hooks/useGamification";
import { getLevelInfo, getProgressToNextLevel } from "@/lib/gamification";

const welcomeMessages = [
  "¡Qué bueno verte de nuevo! Tu dedicación te acerca a tus metas ✨",
  "Cada día de aprendizaje es una victoria. ¡Sigamos adelante! 🚀",
  "Tu esfuerzo de hoy es el éxito de mañana. ¡A por todas! 💪",
  "Bienvenido de nuevo. El conocimiento te espera 🌟",
  "Nueva sesión, nuevas oportunidades. ¡Brilla con todo! 🌠",
  "El aprendizaje es un viaje y tú vas por buen camino 🧭",
  "Hoy es un gran día para aprender algo nuevo 📚",
  "Tu constancia es tu superpoder. ¡Sigue así! ⚡",
  "Cada pequeño paso suma. ¡Bienvenido de vuelta! 🎯",
  "El progreso no se mide en días, pero hoy cuenta el doble 📈",
];

export default function GamificationHeader({ name }: { name: string }) {
  const { data, loading, levelsCatalog } = useGamification();

  // Mensaje aleatorio estable por montaje
  const [msgIndex] = useStateSafe();

  if (loading || !data) {
    return (
      <Card className="cloud-card glow-effect animate-pulse">
        <CardContent className="p-6 h-40 text-left" />
      </Card>
    );
  }

  const xpTotal = data.xp_total ?? 0;
  const level = data.level ?? 1;
  const info = getLevelInfo(level);
  const progress = getProgressToNextLevel(xpTotal);
  const levelIndex = level - 1;
  const nextInfo = getLevelInfo(Math.min(10, level + 1));
  const streak = data.streak_days ?? 0;

  return (
    <Card className="cloud-card glow-effect animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-center gap-6 flex-wrap">
          <EvolvingAvatar name={name} levelIndex={levelIndex} />
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl md:text-3xl font-bold text-gradient">
              ¡Hola, {name}! 👋
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-4 h-4" /> {welcomeMessages[msgIndex]}
            </p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold">{info.title}</span>
                <span className="text-xs text-muted-foreground">Nv. {level}</span>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1 bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs font-medium">
                  <Flame className="w-3 h-3" /> {streak} {streak === 1 ? "día" : "días"}
                </div>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{xpTotal}</div>
            <p className="text-xs text-muted-foreground">XP totales</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1 text-sm">
              <span>Progreso al siguiente nivel: <strong>{nextInfo.title}</strong></span>
              <span className="text-muted-foreground">{progress.progressPercent}%</span>
            </div>
            <Progress value={progress.progressPercent} className="h-3" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1 text-sm">
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-amber-400" /> Energía
              </span>
              <span className="text-muted-foreground">{data.energy ?? 0}/100</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                style={{ width: `${data.energy ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// pequeño helper para mantener consistencia sin useEffect
import { useState } from "react";
function useStateSafe() {
  return useState(() => Math.floor(Math.random() * welcomeMessages.length));
}