import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy } from "lucide-react";
import type { PendingAchievement } from "@/hooks/useAchievements";

interface Props {
  achievement: PendingAchievement | null;
  onDismiss: () => void;
}

export default function AchievementPopup({ achievement, onDismiss }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (achievement) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [achievement]);

  const handleClose = () => {
    setOpen(false);
    // Pequeño delay para que la animación de cierre termine
    setTimeout(() => onDismiss(), 200);
  };

  if (!achievement) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-md text-center border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-500/10 via-background to-background"
      >
        <DialogHeader>
          <div className="flex justify-center mb-4 mt-2">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400/30 blur-2xl rounded-full animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg animate-[bounceIn_0.6s_ease-out]">
                <span className="text-5xl">{achievement.icon || "🏆"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
              ¡Logro desbloqueado!
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <DialogTitle className="text-2xl font-bold text-center">
            {achievement.title}
          </DialogTitle>

          {achievement.description && (
            <DialogDescription className="text-center text-muted-foreground">
              {achievement.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold shadow-lg">
            <Trophy className="w-5 h-5" />
            +{achievement.xp_reward} XP
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleClose}
            size="lg"
            className="glow-effect min-w-[160px]"
          >
            ¡Genial!
          </Button>
        </DialogFooter>
      </DialogContent>

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
    </Dialog>
  );
}