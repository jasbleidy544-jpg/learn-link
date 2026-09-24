import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Lock } from "lucide-react";

type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  xp_reward: number;
  category: string | null;
  unlocked_at: string | null;
};

export default function StudentAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const { data: allAchievements } = await (supabase as any)
        .from("achievements")
        .select("*")
        .order("xp_reward", { ascending: true });

      const { data: userAchievements } = await (supabase as any)
        .from("student_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id);

      const unlockedMap = new Map(
        (userAchievements || []).map((a: any) => [a.achievement_id, a.unlocked_at])
      );

      const merged: Achievement[] = (allAchievements || []).map((a: any) => ({
        ...a,
        unlocked_at: unlockedMap.get(a.id) || null,
      }));

      setAchievements(merged);
      setLoading(false);
    };
    load();
  }, [user]);

  const unlocked = achievements.filter((a) => a.unlocked_at);
  const locked = achievements.filter((a) => !a.unlocked_at);
  const progressPercent = achievements.length
    ? Math.round((unlocked.length / achievements.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <p className="text-center py-12 text-muted-foreground">Cargando logros...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🏆 Mis logros</h1>
        <p className="text-muted-foreground">
          Has desbloqueado {unlocked.length} de {achievements.length} logros
        </p>
      </div>

      <Card className="cloud-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span>Progreso total</span>
            <span className="text-muted-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </CardContent>
      </Card>

      {unlocked.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" /> Desbloqueados
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {unlocked.map((a) => (
              <Card key={a.id} className="cloud-card glow-effect">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl">{a.icon || "🏆"}</div>
                    <Badge variant="default">+{a.xp_reward} XP</Badge>
                  </div>
                  <CardTitle className="text-base">{a.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                  {a.unlocked_at && (
                    <p className="text-xs text-green-400 mt-2">
                      ✓ {new Date(a.unlocked_at).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" /> Por desbloquear
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {locked.map((a) => (
              <Card key={a.id} className="cloud-card opacity-60">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl grayscale">{a.icon || "🏆"}</div>
                    <Badge variant="secondary">+{a.xp_reward} XP</Badge>
                  </div>
                  <CardTitle className="text-base">{a.title}</CardTitle>
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