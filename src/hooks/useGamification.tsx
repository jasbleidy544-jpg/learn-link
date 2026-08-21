import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Gamification = {
  user_id: string;
  xp: number;
  energy: number;
  level_name: string;
  skill_critical: number;
  skill_researcher: number;
  skill_creative: number;
  last_activity: string;
};

export const LEVELS = [
  { name: "Explorador", min: 0 },
  { name: "Aprendiz", min: 100 },
  { name: "Experimentador", min: 300 },
  { name: "Constructor", min: 600 },
  { name: "Colaborador", min: 1000 },
  { name: "Maestro", min: 1500 },
];

export function levelFromXp(xp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? LEVELS[i];
    }
  }
  const span = (next.min - current.min) || 1;
  const progress = Math.min(100, Math.round(((xp - current.min) / span) * 100));
  return { current, next, progress };
}

export function useGamification() {
  const { user } = useAuth();
  const [data, setData] = useState<Gamification | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: row } = await (supabase as any)
      .from("student_gamification")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (row) {
      setData(row);
    } else {
      const { data: created } = await (supabase as any)
        .from("student_gamification")
        .insert({ user_id: user.id })
        .select()
        .maybeSingle();
      setData(created);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const award = useCallback(async (xpDelta: number, skill?: "critical" | "researcher" | "creative", energyDelta = 5) => {
    if (!user || !data) return;
    const newXp = Math.max(0, data.xp + xpDelta);
    const newEnergy = Math.max(0, Math.min(100, data.energy + energyDelta));
    const { current } = levelFromXp(newXp);
    const update: any = {
      xp: newXp,
      energy: newEnergy,
      level_name: current.name,
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (skill) update[`skill_${skill}`] = (data as any)[`skill_${skill}`] + 5;
    await (supabase as any).from("student_gamification").update(update).eq("user_id", user.id);
    setData({ ...data, ...update });
  }, [user, data]);

  return { data, loading, reload: load, award };
}