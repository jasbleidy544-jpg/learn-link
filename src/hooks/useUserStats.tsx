import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  getAvatarUrl,
  getLevelInfo,
  getProgressToNextLevel,
  type LevelInfo,
} from '@/lib/gamification';

export interface UserStats {
  xp_total: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
}

export interface UserStatsProgress {
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

interface UseUserStatsResult {
  stats: UserStats | null;
  loading: boolean;
  levelInfo: LevelInfo;
  progress: UserStatsProgress;
  avatarUrl: string;
  addXp: (amount: number, source: string, description?: string) => Promise<void>;
  refresh: () => Promise<void>;
  markDailyActive: () => Promise<void>;
}

const DEFAULT_STATS: UserStats = {
  xp_total: 0,
  level: 1,
  streak_days: 0,
  last_active_date: null,
};

export function useUserStats(): UseUserStatsResult {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('user_stats')
        .select('xp_total, level, streak_days, last_active_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setStats(data as UserStats);
        return;
      }

      const { data: createdStats, error: createError } = await (supabase as any)
        .from('user_stats')
        .insert({ user_id: user.id, ...DEFAULT_STATS })
        .select('xp_total, level, streak_days, last_active_date')
        .single();

      if (createError) {
        throw createError;
      }

      setStats((createdStats as UserStats | null) ?? DEFAULT_STATS);
    } catch (error) {
      console.error('Error loading user stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const addXp = useCallback(
    async (amount: number, source: string, description?: string): Promise<void> => {
      if (!user?.id) return;

      try {
        const { error } = await (supabase as any).rpc('add_xp', {
          _amount: amount,
          _source: source,
          _description: description ?? null,
          _reference_id: null,
        });

        if (error) {
          throw error;
        }

        await refresh();
      } catch (error) {
        console.error('Error adding XP:', error);
      }
    },
    [refresh, user?.id],
  );

  const markDailyActive = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    try {
      const { error } = await (supabase as any).rpc('update_streak');

      if (error) {
        throw error;
      }

      await refresh();
    } catch (error) {
      console.error('Error updating daily streak:', error);
    }
  }, [refresh, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const level = stats?.level ?? 1;
  const xpTotal = stats?.xp_total ?? 0;
  const levelInfo = useMemo(() => getLevelInfo(level), [level]);
  const progress = useMemo(() => getProgressToNextLevel(xpTotal), [xpTotal]);
  const avatarUrl = user?.id ? getAvatarUrl(user.id, level) : '';

  return {
    stats,
    loading,
    levelInfo,
    progress,
    avatarUrl,
    addXp,
    refresh,
    markDailyActive,
  };
}
