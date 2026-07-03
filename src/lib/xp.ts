/** XP economy + level math. All values per ZaLife gamification spec. */

export const XP_VALUES = {
  MORNING_PLAN_BEFORE_TEN: 50,
  MIDDAY_CHECKIN: 30,
  TOP_PRIORITY_TASK: 100,
  TASK_COMPLETE: 20,
  NIGHT_REFLECTION: 50,
  SMART_GOAL_COMPLETE: 500,
  SUNDAY_RESET: 300,
  // Awarded when the user confirms a proactive mindset check-in is aligned
  // with the version of themselves they are building (anti-autopilot hook).
  IDENTITY_ALIGNMENT: 40,
} as const;

export type XpEvent = keyof typeof XP_VALUES;

/**
 * Level threshold curve. Each level needs progressively more XP.
 * Returns total cumulative XP required to *reach* a given level.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Quadratic-ish curve: level 2 = 300, 3 = 800, 4 = 1500 ...
  return Math.round(250 * (level - 1) + 50 * (level - 1) * (level - 1));
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  currentLevelFloor: number;
  nextLevelFloor: number;
  intoLevel: number;
  span: number;
  percent: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const currentLevelFloor = xpForLevel(level);
  const nextLevelFloor = xpForLevel(level + 1);
  const span = nextLevelFloor - currentLevelFloor;
  const intoLevel = xp - currentLevelFloor;
  return {
    level,
    currentLevelFloor,
    nextLevelFloor,
    intoLevel,
    span,
    percent: span > 0 ? Math.min(100, Math.round((intoLevel / span) * 100)) : 100,
  };
}
