import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "learnlink:streak:last-check";

/**
 * Dispara update_streak una sola vez por día.
 * Se usa en el StudentLayout al cargar.
 */
export function useDailyStreak() {
  const { user } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user || hasRun.current) return;

    const today = new Date().toISOString().slice(0, 10); // "2026-10-10"
    const lastCheck = localStorage.getItem(STORAGE_KEY);

    // Ya se ejecutó hoy
    if (lastCheck === today) {
      hasRun.current = true;
      return;
    }

    hasRun.current = true;

    (async () => {
      try {
        const { data, error } = await (supabase as any).rpc("update_streak");
        if (error) {
          console.error("[useDailyStreak] error:", error);
          return;
        }
        // Marcar como hecho hoy (solo si fue exitoso)
        localStorage.setItem(STORAGE_KEY, today);

        // Notificar a la app que hubo cambio (dispara pop-ups de logros/nivel)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("learnlink:xp-gained"));
        }
        console.log("[useDailyStreak] Racha actualizada:", data);
      } catch (err) {
        console.error("[useDailyStreak] catch:", err);
      }
    })();
  }, [user]);
}