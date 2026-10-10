import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PendingAchievement {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  xp_reward: number;
  unlocked_at: string;
}

export interface LevelUpEvent {
  previousLevel: number;
  newLevel: number;
  newTitle: string;
}

export function useAchievements() {
  const { user } = useAuth();
  const [pendingAchievements, setPendingAchievements] = useState<PendingAchievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<PendingAchievement | null>(null);
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastKnownLevel, setLastKnownLevel] = useState<number | null>(null);

  // Cargar logros pendientes desde la BD
  const loadPending = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc("get_pending_achievements");
      if (error) {
        console.error("[useAchievements] load pending error:", error);
        return;
      }
      setPendingAchievements(data || []);
    } catch (err) {
      console.error("[useAchievements] catch:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cuando hay pendientes y no hay uno en pantalla, mostrar el primero
  useEffect(() => {
    if (!currentAchievement && pendingAchievements.length > 0) {
      setCurrentAchievement(pendingAchievements[0]);
    }
  }, [pendingAchievements, currentAchievement]);

  // Cerrar el pop-up actual y pasar al siguiente
  const dismissCurrent = useCallback(async () => {
    if (!currentAchievement) return;
    try {
      await (supabase as any).rpc("mark_achievements_seen", {
        _ids: [currentAchievement.id],
      });
    } catch (err) {
      console.error("[useAchievements] mark seen error:", err);
    }
    setPendingAchievements((prev) => prev.filter((a) => a.id !== currentAchievement.id));
    setCurrentAchievement(null);
  }, [currentAchievement]);

  // Detectar subida de nivel
  const checkLevelUp = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await (supabase as any)
        .from("user_stats")
        .select("level")
        .eq("user_id", user.id)
        .maybeSingle();

      const newLevel = data?.level ?? 1;
      if (lastKnownLevel !== null && newLevel > lastKnownLevel) {
        const { getLevelInfo } = await import("@/lib/gamification");
        setLevelUpEvent({
          previousLevel: lastKnownLevel,
          newLevel,
          newTitle: getLevelInfo(newLevel).title,
        });
      }
      setLastKnownLevel(newLevel);
    } catch (err) {
      console.error("[useAchievements] checkLevelUp error:", err);
    }
  }, [user, lastKnownLevel]);

  // Cerrar el pop-up de nivel
  const dismissLevelUp = useCallback(() => {
    setLevelUpEvent(null);
  }, []);

  // Cargar al montar
  useEffect(() => {
    loadPending();
    checkLevelUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Escuchar eventos globales de la app
  useEffect(() => {
    const handler = () => {
      loadPending();
      checkLevelUp();
    };
    window.addEventListener("learnlink:activity-completed", handler);
    window.addEventListener("learnlink:xp-gained", handler);
    return () => {
      window.removeEventListener("learnlink:activity-completed", handler);
      window.removeEventListener("learnlink:xp-gained", handler);
    };
  }, [loadPending, checkLevelUp]);

  return {
    currentAchievement,
    levelUpEvent,
    dismissCurrent,
    dismissLevelUp,
    loadPending,
    checkLevelUp,
  };
}