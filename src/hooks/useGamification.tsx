import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LEVELS as NEW_LEVELS,
  getLevelInfo,
  getProgressToNextLevel,
  getCurrentLevelFromXp,
} from "@/lib/gamification";

export type Gamification = {
  user_id: string;
  xp_total: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
  energy: number;
  skill_critical: number;
  skill_researcher: number;
  skill_creative: number;
};

export function useGamification() {
  const { user } = useAuth();
  const [data, setData] = useState<Gamification | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: row, error } = await (supabase as any)
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[useGamification] error cargando stats:", error);
      setData(null);
    } else if (row) {
      setData(row as Gamification);
    } else {
      const { data: created, error: createError } = await (supabase as any)
        .from("user_stats")
        .insert({ user_id: user.id })
        .select()
        .maybeSingle();
      if (createError) console.error("[useGamification] error creando stats:", createError);
      setData((created as Gamification) || null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const award = useCallback(
    async (
      xpDelta: number,
      skill?: "critical" | "researcher" | "creative",
      energyDelta = 5
    ) => {
      if (!user || !data) return;

      if (xpDelta !== 0) {
        const { error: rpcErr } = await (supabase as any).rpc("add_xp", {
          _amount: xpDelta,
          _source: "activity",
          _description: null,
          _reference_id: null,
        });
        if (rpcErr) console.error("[useGamification] add_xp error:", rpcErr);
      }

      const updates: any = {};
      if (energyDelta !== 0) {
        updates.energy = Math.max(0, Math.min(100, data.energy + energyDelta));
      }
      if (skill) {
        const field = `skill_${skill}`;
        updates[field] = ((data as any)[field] || 0) + 5;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updErr } = await (supabase as any)
          .from("user_stats")
          .update(updates)
          .eq("user_id", user.id);
        if (updErr) console.error("[useGamification] update error:", updErr);
      }

      await load();
    },
    [user, data, load]
  );

  const xpTotal = data?.xp_total ?? 0;
  const level = data?.level ?? 1;

  return {
    data,
    loading,
    reload: load,
    award,
    levelInfo: getLevelInfo(level),
    progress: getProgressToNextLevel(xpTotal),
    levelsCatalog: NEW_LEVELS,
  };
}

// =============================================
// COMPATIBILIDAD CON CÓDIGO ANTIGUO
// (AchievementsDialog y otros importan LEVELS y levelFromXp)
// =============================================

export const LEVELS = NEW_LEVELS.map((lvl) => ({
  name: lvl.title,
  min: lvl.xpRequired,
}));

export function levelFromXp(xp: number) {
  const currentLevel = getCurrentLevelFromXp(xp);
  const currentInfo = getLevelInfo(currentLevel);
  const nextInfo = getLevelInfo(Math.min(10, currentLevel + 1));
  const progress = getProgressToNextLevel(xp);

  return {
    current: { name: currentInfo.title, min: currentInfo.xpRequired },
    next: { name: nextInfo.title, min: nextInfo.xpRequired },
    progress: progress.progressPercent,
  };
}