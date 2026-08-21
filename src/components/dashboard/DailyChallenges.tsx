import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, CheckCircle, Play, Calculator, FlaskConical, BookOpen, Atom, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdaptiveQuizDialog from "./AdaptiveQuizDialog";

type Challenge = {
  id: string;
  area: string | null;
  challenge_type: string;
  title: string;
  description: string;
  xp_reward: number;
  completed: boolean;
  score?: number;
};

const AREAS = ["matemáticas", "lenguaje", "ciencias", "biología", "sociales"];

const AREA_META: Record<string, { icon: any; label: string }> = {
  "matemáticas": { icon: Calculator, label: "Matemáticas" },
  "lenguaje": { icon: BookOpen, label: "Lenguaje" },
  "ciencias": { icon: FlaskConical, label: "Ciencias" },
  "biología": { icon: Atom, label: "Biología" },
  "sociales": { icon: Languages, label: "Sociales" },
};

// Pick the 3 weakest areas using diagnostic + activity history.
async function pickAreas(userId: string): Promise<string[]> {
  const scores: Record<string, number> = {};
  AREAS.forEach((a) => (scores[a] = 50));

  const { data: diag } = await (supabase as any)
    .from("diagnostic_results").select("results").eq("student_id", userId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (diag?.results && typeof diag.results === "object") {
    for (const [k, v] of Object.entries(diag.results as Record<string, any>)) {
      const key = String(k).toLowerCase();
      const match = AREAS.find((a) => key.includes(a));
      if (match && typeof v === "number") scores[match] = Math.min(scores[match], v);
    }
  }

  const { data: acts } = await (supabase as any)
    .from("student_activities").select("area,score,status")
    .eq("student_id", userId).eq("status", "completed")
    .order("completed_at", { ascending: false }).limit(20);
  const byArea: Record<string, number[]> = {};
  (acts || []).forEach((a: any) => {
    const key = AREAS.find((x) => String(a.area || "").toLowerCase().includes(x));
    if (key) (byArea[key] ||= []).push(Number(a.score) || 0);
  });
  for (const [k, arr] of Object.entries(byArea)) {
    const avg = arr.reduce((s, n) => s + n, 0) / arr.length;
    scores[k] = Math.round((scores[k] + avg) / 2);
  }

  return Object.entries(scores).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([k]) => k);
}

export default function DailyChallenges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Challenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);

  const load = async () => {
    if (!user) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { data } = await (supabase as any)
      .from("daily_challenges")
      .select("*")
      .eq("student_id", user.id)
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: true });
    if (!data || data.length === 0) {
      const areas = await pickAreas(user.id);
      const seeded = areas.map((area, i) => ({
        student_id: user.id,
        area,
        challenge_type: "adaptive",
        title: `Reto adaptativo de ${AREA_META[area]?.label ?? area}`,
        description: `La IA generará 5 preguntas tipo ICFES de ${AREA_META[area]?.label ?? area} ajustadas a tu nivel.`,
        xp_reward: 20 + i * 5,
      }));
      const { data: inserted } = await (supabase as any)
        .from("daily_challenges").insert(seeded).select();
      setItems(inserted || []);
    } else {
      setItems(data);
    }
  };

  useEffect(() => { load(); }, [user]);

  const onQuizCompleted = async ({ score }: { score: number }) => {
    if (!activeChallenge) return;
    await (supabase as any).from("daily_challenges")
      .update({ completed: true, score, completed_at: new Date().toISOString() })
      .eq("id", activeChallenge.id);
    setItems((arr) => arr.map((x) => x.id === activeChallenge.id ? { ...x, completed: true, score } : x));
    toast({ title: "Reto completado", description: `Puntaje: ${score}/100` });
    window.dispatchEvent(new CustomEvent("learnlink:activity-completed"));
  };

  return (
    <Card className="cloud-card animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Retos del día
        </CardTitle>
        <span className="text-xs text-muted-foreground">Generados por IA según tu desempeño</span>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-3">
        {items.map((c) => {
          const meta = c.area ? AREA_META[c.area] : null;
          const Icon = meta?.icon ?? Sparkles;
          return (
            <Card key={c.id} className={`p-4 transition-all hover-scale ${c.completed ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-2 mb-2">
                <Icon className="w-5 h-5 text-primary" />
                <h4 className="font-semibold flex-1">{c.title}</h4>
                <span className="text-xs text-amber-400 font-bold">+{c.xp_reward}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
              <Button
                size="sm"
                className="w-full"
                variant={c.completed ? "outline" : "default"}
                onClick={() => setActiveChallenge(c)}
                disabled={c.completed}
              >
                {c.completed
                  ? <><CheckCircle className="w-4 h-4 mr-1" /> {c.score ?? 0}/100</>
                  : <><Play className="w-4 h-4 mr-1" /> Iniciar reto</>}
              </Button>
            </Card>
          );
        })}
      </CardContent>
      <AdaptiveQuizDialog
        open={!!activeChallenge}
        onOpenChange={(o) => { if (!o) setActiveChallenge(null); }}
        area={activeChallenge?.area || undefined}
        count="auto"
        onCompleted={onQuizCompleted}
      />
    </Card>
  );
}