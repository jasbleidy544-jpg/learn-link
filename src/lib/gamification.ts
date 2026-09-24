export interface LevelInfo {
  level: number;
  xpRequired: number;
  avatarStyle: string;
  title: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, xpRequired: 0, avatarStyle: 'bottts', title: 'Huevo' },
  { level: 2, xpRequired: 100, avatarStyle: 'bottts', title: 'Polluelo' },
  { level: 3, xpRequired: 250, avatarStyle: 'adventurer', title: 'Pajarito' },
  { level: 4, xpRequired: 500, avatarStyle: 'adventurer', title: 'Águila joven' },
  { level: 5, xpRequired: 1000, avatarStyle: 'avataaars', title: 'Búho sabio' },
  { level: 6, xpRequired: 1800, avatarStyle: 'avataaars', title: 'Zorro astuto' },
  { level: 7, xpRequired: 3000, avatarStyle: 'lorelei', title: 'Lobo' },
  { level: 8, xpRequired: 5000, avatarStyle: 'lorelei', title: 'Tigre' },
  { level: 9, xpRequired: 8000, avatarStyle: 'notionists', title: 'León' },
  { level: 10, xpRequired: 12000, avatarStyle: 'notionists', title: 'Dragón legendario' },
];

export const XP_EASY_ACTIVITY = 10;
export const XP_MEDIUM_ACTIVITY = 20;
export const XP_HARD_ACTIVITY = 30;
export const XP_PER_CORRECT_ANSWER = 5;
export const XP_STREAK_DAILY = 15;

export function getLevelInfo(level: number): LevelInfo {
  const normalizedLevel = Math.max(1, Math.floor(level));
  return LEVELS.find((levelInfo) => levelInfo.level === normalizedLevel) ?? LEVELS[LEVELS.length - 1];
}

export function getProgressToNextLevel(xpTotal: number): {
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const normalizedXp = Math.max(0, xpTotal);
  const currentLevelIndex = LEVELS.reduce(
    (highestIndex, levelInfo, index) =>
      levelInfo.xpRequired <= normalizedXp ? index : highestIndex,
    0,
  );
  const currentLevel = LEVELS[currentLevelIndex];
  const nextLevel = LEVELS[currentLevelIndex + 1];

  if (!nextLevel) {
    return {
      currentLevelXp: currentLevel.xpRequired,
      nextLevelXp: currentLevel.xpRequired,
      progressPercent: 100,
    };
  }

  const levelRange = nextLevel.xpRequired - currentLevel.xpRequired;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((normalizedXp - currentLevel.xpRequired) / levelRange) * 100),
  );

  return {
    currentLevelXp: currentLevel.xpRequired,
    nextLevelXp: nextLevel.xpRequired,
    progressPercent,
  };
}

export function getAvatarUrl(userId: string, level: number): string {
  const { avatarStyle } = getLevelInfo(level);
  return `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(userId)}`;
}
