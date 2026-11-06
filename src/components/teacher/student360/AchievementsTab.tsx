import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy, Lock } from "lucide-react";

type Achievement = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  xp_reward: number;
  unlocked_at: string | null;
};

export default function AchievementsTab({ studentId }: { studentId: string }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: all }, { data: unlocked }] = await Promise.all([
        (supabase as any).from("achievements").select("*").order("xp_reward", { ascending: true }),
        (supabase as any).from("student_achievements").select("achievement_id, unlocked_at").eq("user_id", studentId),
      ]);
      if (cancelled) return;
      const unlockedMap = new Map((unlocked || []).map((a: any) => [a.achievement_id, a.unlocked_at]));
      const merged: Achievement[] = (all || []).map((a: any) => ({
        ...a,
        unlocked_at: (unlockedMap.get(a.id) as string) || null,
      }));
      setAchievements(merged);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando logros…
      </div>
    );
  }

  const unlockedList = achievements.filter((a) => a.unlocked_at);
  const lockedList = achievements.filter((a) => !a.unlocked_at);
  const pct = achievements.length ? Math.round((unlockedList.length / achievements.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="cloud-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium">Progreso de logros</span>
            <span className="text-muted-foreground">{unlockedList.length}/{achievements.length} ({pct}%)</span>
          </div>
          <Progress value={pct} className="h-3" />
        </CardContent>
      </Card>

      {unlockedList.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Desbloqueados
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {unlockedList.map((a) => (
              <Card key={a.id} className="cloud-card glow-effect">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl">{a.icon || "🏆"}</div>
                    <Badge>+{a.xp_reward} XP</Badge>
                  </div>
                  <CardTitle className="text-sm">{a.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                  {a.unlocked_at && (
                    <p className="text-xs text-green-400 mt-2">
                      ✓ {new Date(a.unlocked_at).toLocaleDateString("es-CO")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {lockedList.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" /> Por desbloquear
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {lockedList.map((a) => (
              <Card key={a.id} className="cloud-card opacity-60">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl grayscale">{a.icon || "🏆"}</div>
                    <Badge variant="secondary">+{a.xp_reward} XP</Badge>
                  </div>
                  <CardTitle className="text-sm">{a.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
