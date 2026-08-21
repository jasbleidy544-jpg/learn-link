import { motion } from "framer-motion";

const LEVELS = ["🌱 Principiante", "📚 Intermedio", "⚡ Avanzado", "🏆 Experto"];

export default function LevelProgressBar({
  currentLevel, levelProgressPct,
}: { currentLevel: number; levelProgressPct: number }) {
  // currentLevel: 1..4 (which level user is currently on)
  // levelProgressPct: 0..100 within current level
  const safeLevel = Math.min(Math.max(currentLevel, 1), 4);
  const currentName = LEVELS[safeLevel - 1] || LEVELS[0];
  const nextName = LEVELS[safeLevel] || null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{currentName}</span>
        <span>{Math.round(levelProgressPct)}% completado</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {LEVELS.map((_, i) => {
          const idx = i + 1;
          const completed = idx < safeLevel;
          const isCurrent = idx === safeLevel;
          const pct = completed ? 100 : isCurrent ? levelProgressPct : 0;
          return (
            <div key={i} className="h-3 rounded-full bg-muted/40 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full ${completed ? "bg-green-500" : "bg-gradient-to-r from-primary to-purple-400"}`}
              />
            </div>
          );
        })}
      </div>
      {nextName && (
        <p className="text-xs text-muted-foreground">
          {levelProgressPct >= 100
            ? `¡Listo para desbloquear ${nextName}!`
            : `Sigue así para desbloquear ${nextName}`}
        </p>
      )}
      {!nextName && (
        <p className="text-xs text-primary">¡Llegaste al nivel máximo! 🏆</p>
      )}
    </div>
  );
}