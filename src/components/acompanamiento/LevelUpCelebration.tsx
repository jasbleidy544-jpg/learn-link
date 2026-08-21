import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function LevelUpCelebration({
  open, onClose, levelName, mensaje,
}: { open: boolean; onClose: () => void; levelName: string; mensaje: string }) {
  useEffect(() => {
    if (!open) return;
    const end = Date.now() + 1200;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors: ["#a855f7", "#c084fc", "#ffffff"] });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors: ["#a855f7", "#c084fc", "#ffffff"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" /> ¡Nivel desbloqueado!
          </DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4 py-2">
          <div className="text-5xl">🎉</div>
          <p className="text-xl font-bold">{levelName}</p>
          <p className="text-sm text-muted-foreground">{mensaje}</p>
          <Button onClick={onClose} className="w-full">¡Sigamos!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}