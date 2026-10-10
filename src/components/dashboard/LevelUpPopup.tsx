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
import { ArrowUp, Sparkles, Star } from "lucide-react";
import type { LevelUpEvent } from "@/hooks/useAchievements";
import { getLevelInfo, getAvatarUrl } from "@/lib/gamification";

interface Props {
  event: LevelUpEvent | null;
  userId?: string;
  onDismiss: () => void;
}

export default function LevelUpPopup({ event, userId, onDismiss }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (event) setOpen(true);
    else setOpen(false);
  }, [event]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => onDismiss(), 200);
  };

  if (!event) return null;

  const newInfo = getLevelInfo(event.newLevel);
  const avatarUrl = userId ? getAvatarUrl(userId, event.newLevel) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-md text-center border-2 border-primary/40 bg-gradient-to-b from-primary/10 via-background to-background"
      >
        <DialogHeader>
          <div className="flex justify-center mb-4 mt-2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full animate-pulse" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg animate-[levelUpPop_0.7s_ease-out]">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`Nivel ${event.newLevel}`}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <span className="text-5xl">🎉</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full p-2 shadow-lg">
                <ArrowUp className="w-5 h-5 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              ¡Subiste de nivel!
            </span>
            <Star className="w-4 h-4 text-primary fill-primary" />
          </div>

          <DialogTitle className="text-3xl font-bold text-center">
            Nivel {event.newLevel}
          </DialogTitle>

          <DialogDescription className="text-center text-muted-foreground">
            Pasaste de <strong>Nivel {event.previousLevel}</strong> a{" "}
            <strong>{event.newTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold shadow-lg">
            <Sparkles className="w-5 h-5" />
            {newInfo.title}
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleClose}
            size="lg"
            className="glow-effect min-w-[160px]"
          >
            ¡Seguir aprendiendo!
          </Button>
        </DialogFooter>
      </DialogContent>

      <style>{`
        @keyframes levelUpPop {
          0% { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </Dialog>
  );
}