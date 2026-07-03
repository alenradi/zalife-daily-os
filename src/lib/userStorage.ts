/**
 * Per-user local persistence. Each account gets its own isolated state slice.
 */

import type { AppState } from "../store/useAppStore";

const USER_PREFIX = "zalife-user-v1-";
const LEGACY_KEY = "zalife-daily-os-v2";

export function userStorageKey(userId: string): string {
  return `${USER_PREFIX}${userId}`;
}

export function hasUserState(userId: string): boolean {
  return localStorage.getItem(userStorageKey(userId)) !== null;
}

/** Fields persisted per user (excludes ephemeral UI like modals). */
export function pickPersistable(state: AppState): Record<string, unknown> {
  return {
    profile: state.profile,
    moj_smisel_zivljenja: state.moj_smisel_zivljenja,
    jaz_sem_status: state.jaz_sem_status,
    identity_locked: state.identity_locked,
    identity_editing: state.identity_editing,
    identity_change_log: state.identity_change_log,
    xp_points: state.xp_points,
    status: state.status,
    drift_warnings: state.drift_warnings,
    streak_days: state.streak_days,
    last_streak_date: state.last_streak_date,
    system_locked: state.system_locked,
    drift_handled_date: state.drift_handled_date,
    last_reminder_at: state.last_reminder_at,
    alerted_goals: state.alerted_goals,
    daily_logs: state.daily_logs,
    weekly_resets: state.weekly_resets,
    next_week_unlocked: state.next_week_unlocked,
    next_week_plan: state.next_week_plan,
    goals: state.goals,
    pillars: state.pillars,
    planner_tasks: state.planner_tasks,
    recurring_tasks: state.recurring_tasks,
    recurring_done: state.recurring_done,
    chat: state.chat,
    onboarding_completed: state.onboarding_completed,
  };
}

export function saveUserState(userId: string, state: AppState): void {
  if (!userId) return;
  try {
    localStorage.setItem(
      userStorageKey(userId),
      JSON.stringify(pickPersistable(state))
    );
  } catch (e) {
    console.error("[storage] save failed", e);
  }
}

export function loadUserState(
  userId: string
): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(userStorageKey(userId));
    if (raw) return JSON.parse(raw) as Partial<AppState>;
  } catch {
    /* ignore */
  }
  return null;
}

/** One-time migration from the old shared localStorage blob. */
export function loadLegacySharedState(
  userId: string
): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: Partial<AppState> };
    const state = parsed.state ?? (parsed as Partial<AppState>);
    if (state.profile?.user_id === userId) return state;
  } catch {
    /* ignore */
  }
  return null;
}
