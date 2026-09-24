import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LEVELS, getLevelInfo, getProgressToNextLevel } from "@/lib/gamification";

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
    const { data: row, error } = await supabase
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
      const { data: created, error: createError } = await supabase
        .from("user_stats")
        .insert({ user_id: user.id })
        .select()
        .maybeSingle();
      if (createError) console.error("[useGamification] error creando stats:", createError);
      setData((created as Gamification) || null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  /**
   * Otorga XP, energía y skill en una sola operación.
   * @param xpDelta  XP a sumar (puede ser negativo)
   * @param skill    "critical" | "researcher" | "creative" (opcional)
   * @param energyDelta cambio de energía (default +5, puede ser negativo)
   */
  const award = useCallback(
    async (
      xpDelta: number,
      skill?: "critical" | "researcher" | "creative",
      energyDelta = 5
    ) => {
      if (!user || !data) return;

      // 1) Sumar XP vía RPC (registra transacción y recalcula nivel)
      if (xpDelta !== 0) {
        const { error: rpcErr } = await supabase.rpc("add_xp", {
          _amount: xpDelta,
          _source: "activity",
          _description: null,
          _reference_id: null,
        });
        if (rpcErr) console.error("[useGamification] add_xp error:", rpcErr);
      }

      // 2) Actualizar energía y skill directamente
      const updates: any = {};
      if (energyDelta !== 0) {
        updates.energy = Math.max(0, Math.min(100, data.energy + energyDelta));
      }
      if (skill) {
        const field = `skill_${skill}`;
        updates[field] = ((data as any)[field] || 0) + 5;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updErr } = await supabase
          .from("user_stats")
          .update(updates)
          .eq("user_id", user.id);
        if (updErr) console.error("[useGamification] update error:", updErr);
      }

      // 3) Recargar estado
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
    levelsCatalog: LEVELS,
  };
}