// =============================================
// SISTEMA DE GAMIFICACIÓN - CONSTANTES
// =============================================

export interface LevelInfo {
  level: number;
  xpRequired: number;
  avatarStyle: string;
  title: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1,  xpRequired: 0,     avatarStyle: 'bottts',     title: 'Huevo' },
  { level: 2,  xpRequired: 100,   avatarStyle: 'bottts',     title: 'Polluelo' },
  { level: 3,  xpRequired: 250,   avatarStyle: 'adventurer', title: 'Pajarito' },
  { level: 4,  xpRequired: 500,   avatarStyle: 'adventurer', title: 'Águila joven' },
  { level: 5,  xpRequired: 1000,  avatarStyle: 'avataaars',  title: 'Búho sabio' },
  { level: 6,  xpRequired: 1800,  avatarStyle: 'avataaars',  title: 'Zorro astuto' },
  { level: 7,  xpRequired: 3000,  avatarStyle: 'lorelei',    title: 'Lobo' },
  { level: 8,  xpRequired: 5000,  avatarStyle: 'lorelei',    title: 'Tigre' },
  { level: 9,  xpRequired: 8000,  avatarStyle: 'notionists', title: 'León' },
  { level: 10, xpRequired: 12000, avatarStyle: 'notionists', title: 'Dragón legendario' },
];

export const XP_EASY_ACTIVITY = 10;
export const XP_MEDIUM_ACTIVITY = 20;
export const XP_HARD_ACTIVITY = 30;
export const XP_PER_CORRECT_ANSWER = 5;
export const XP_STREAK_DAILY = 15;

export function getLevelInfo(level: number): LevelInfo {
  if (level < 1) level = 1;
  if (level > 10) level = 10;
  return LEVELS[level - 1];
}

export function getCurrentLevelFromXp(xpTotal: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xpTotal >= LEVELS[i].xpRequired) return LEVELS[i].level;
  }
  return 1;
}

export function getProgressToNextLevel(xpTotal: number): {
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const currentLevel = getCurrentLevelFromXp(xpTotal);
  const current = LEVELS[currentLevel - 1];
  const next = currentLevel < 10 ? LEVELS[currentLevel] : LEVELS[9];
  const currentLevelXp = current.xpRequired;
  const nextLevelXp = next.xpRequired;
  const range = nextLevelXp - currentLevelXp;
  const earned = xpTotal - currentLevelXp;
  const progressPercent = range > 0 ? Math.min(100, Math.round((earned / range) * 100)) : 100;
  return { currentLevelXp, nextLevelXp, progressPercent };
}

export function getAvatarUrl(seed: string, level: number): string {
  const info = getLevelInfo(level);
  const safeSeed = encodeURIComponent(seed || 'estudiante');
  return `https://api.dicebear.com/7.x/${info.avatarStyle}/svg?seed=${safeSeed}`;
}