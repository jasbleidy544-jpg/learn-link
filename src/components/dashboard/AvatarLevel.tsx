import { useState } from 'react';
import { getAvatarUrl, getLevelInfo } from '@/lib/gamification';

interface AvatarLevelProps {
  userId: string;
  level: number;
  xpTotal: number;
  streakDays: number;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: {
    avatar: 'h-12 w-12',
    title: 'text-xs',
    detail: 'text-[10px]',
    gap: 'gap-1',
    badge: 'text-[10px]',
  },
  md: {
    avatar: 'h-20 w-20',
    title: 'text-sm',
    detail: 'text-xs',
    gap: 'gap-1.5',
    badge: 'text-xs',
  },
  lg: {
    avatar: 'h-[120px] w-[120px]',
    title: 'text-base',
    detail: 'text-sm',
    gap: 'gap-2',
    badge: 'text-sm',
  },
} as const;

const LEVEL_BORDER_COLORS = [
  'border-slate-300',
  'border-emerald-400',
  'border-sky-400',
  'border-blue-500',
  'border-violet-500',
  'border-purple-600',
  'border-amber-500',
  'border-orange-500',
  'border-rose-500',
  'border-yellow-400',
] as const;

function getLevelBorderColor(level: number): string {
  const index = Math.max(0, Math.min(LEVEL_BORDER_COLORS.length - 1, Math.floor(level) - 1));
  return LEVEL_BORDER_COLORS[index];
}

export function AvatarLevel({
  userId,
  level,
  xpTotal,
  streakDays,
  size = 'md',
}: AvatarLevelProps) {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = SIZE_CONFIG[size];
  const levelInfo = getLevelInfo(level);
  const avatarUrl = getAvatarUrl(userId, level);
  const borderColor = getLevelBorderColor(level);

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`relative rounded-full border-4 ${borderColor} bg-muted p-1 shadow-md`}
        aria-label={`Avatar de ${levelInfo.title}`}
      >
        <div
          className={`${sizeConfig.avatar} flex items-center justify-center overflow-hidden rounded-full bg-background`}
        >
          {imageError ? (
            <span className="text-3xl" role="img" aria-label="Avatar de respaldo">
              🎓
            </span>
          ) : (
            <img
              src={avatarUrl}
              alt={`Avatar del usuario, nivel ${level}: ${levelInfo.title}`}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>
        {streakDays > 0 && (
          <span
            className={`absolute -bottom-1 -right-2 rounded-full bg-orange-500 px-2 py-0.5 font-semibold text-white shadow ${sizeConfig.badge}`}
            aria-label={`Racha de ${streakDays} días`}
          >
            🔥 {streakDays}
          </span>
        )}
      </div>

      <div className={`mt-2 flex flex-col items-center ${sizeConfig.gap}`}>
        <p className={`font-semibold text-foreground ${sizeConfig.title}`}>
          Nv. {level} · {levelInfo.title}
        </p>
        <p className={`text-muted-foreground ${sizeConfig.detail}`}>
          {xpTotal.toLocaleString()} XP
        </p>
        <p className={`text-muted-foreground ${sizeConfig.detail}`}>
          🔥 {streakDays} {streakDays === 1 ? 'día' : 'días'}
        </p>
      </div>
    </div>
  );
}

export default AvatarLevel;
