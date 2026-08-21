import { CheckCircle2, Lock, Play } from "lucide-react";
import type { Level } from "./LevelDialog";

export default function JourneyPath({
  camino, currentLevel, onPick,
}: { camino: Level[]; currentLevel: number; onPick: (index: number) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {camino.map((lvl, i) => {
        const idx = i + 1;
        const completed = idx < currentLevel;
        const isCurrent = idx === currentLevel;
        const locked = idx > currentLevel;
        return (
          <button
            key={i}
            disabled={locked}
            onClick={() => onPick(i)}
            className={`relative text-left p-4 rounded-xl border transition ${
              completed
                ? "border-green-500/50 bg-green-500/10 hover:bg-green-500/15"
                : isCurrent
                ? "border-primary bg-primary/15 shadow-lg shadow-primary/30 hover:bg-primary/20"
                : "border-border bg-muted/20 opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-2xl ${
                completed ? "bg-green-500/30" : isCurrent ? "bg-primary/30" : "bg-muted"
              }`}>
                {completed ? <CheckCircle2 className="w-6 h-6 text-green-400" />
                  : locked ? <Lock className="w-5 h-5 text-muted-foreground" />
                  : <Play className="w-5 h-5 text-primary" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Nivel {idx} · {lvl.dificultad || "—"}</p>
                <p className="font-bold text-base">{lvl.nombre}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{lvl.descripcion}</p>
                {isCurrent && (
                  <p className="text-xs font-semibold text-primary mt-2">Toca para empezar →</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}