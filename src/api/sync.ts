/**
 * Cloud sync — pushes local app state to Supabase so admin can see all users.
 * Requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (see supabase/schema.sql).
 */

import { getSupabase, isCloudConfigured, type UserSnapshot } from "../lib/supabase";
import { useAppStore } from "../store/useAppStore";
import { useAuthStore } from "../store/useAuthStore";
import type { StudentRecord } from "../types";
import { levelFromXp } from "../lib/xp";
import { todayISO, lastNDates } from "../lib/date";

function weeklyXpFromLogs(logs: Record<string, { xp_earned?: number }>): number {
  return lastNDates(7).reduce((acc, d) => acc + (logs[d]?.xp_earned ?? 0), 0);
}

/** Build a serialisable payload from current stores. */
function buildSnapshot(): UserSnapshot | null {
  const auth = useAuthStore.getState();
  const account = auth.currentAccount();
  const app = useAppStore.getState();
  if (!account) return null;

  const today = todayISO();
  const todayLog = app.daily_logs[today];

  return {
    user_id: account.id,
    email: account.email,
    display_name: app.profile.display_name || account.name,
    provider: account.provider,
    data: {
      profile: app.profile,
      moj_smisel_zivljenja: app.moj_smisel_zivljenja,
      jaz_sem_status: app.jaz_sem_status,
      identity_locked: app.identity_locked,
      identity_change_log: app.identity_change_log,
      xp_points: app.xp_points,
      status: app.status,
      drift_warnings: app.drift_warnings,
      streak_days: app.streak_days,
      system_locked: app.system_locked,
      daily_logs: app.daily_logs,
      weekly_resets: app.weekly_resets,
      goals: app.goals,
      pillars: app.pillars,
      planner_tasks: app.planner_tasks,
      recurring_tasks: app.recurring_tasks,
      recurring_done: app.recurring_done,
      onboarding_completed: app.onboarding_completed,
      alerted_goals: app.alerted_goals,
      alerted_reminders: app.alerted_reminders,
      drift_handled_date: app.drift_handled_date,
      last_streak_date: app.last_streak_date,
      next_week_unlocked: app.next_week_unlocked,
      next_week_plan: app.next_week_plan,
      morning_submitted_today: !!todayLog?.morning?.submitted,
      midday_submitted_today: !!todayLog?.midday?.submitted,
      night_submitted_today: !!todayLog?.night?.submitted,
    },
    updated_at: new Date().toISOString(),
  };
}

/** Upsert the current user's snapshot to Supabase. */
export async function pushUserSnapshot(): Promise<boolean> {
  if (!isCloudConfigured()) return false;
  const snap = buildSnapshot();
  if (!snap) return false;

  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from("user_snapshots").upsert(snap, {
    onConflict: "user_id",
  });
  if (error) {
    console.error("[sync] push failed", error.message);
    return false;
  }
  markCloudSynced(snap.user_id, snap.updated_at);
  return true;
}

export function cloudSyncKey(userId: string): string {
  return `zalife-last-cloud-${userId}`;
}

export function markCloudSynced(userId: string, updatedAt: string): void {
  try {
    localStorage.setItem(cloudSyncKey(userId), updatedAt);
  } catch {
    /* ignore */
  }
}

export function lastCloudSyncAt(userId: string): string | null {
  try {
    return localStorage.getItem(cloudSyncKey(userId));
  } catch {
    return null;
  }
}

/** Fetch one user's cloud snapshot. */
export async function fetchUserSnapshot(
  userId: string
): Promise<UserSnapshot | null> {
  if (!isCloudConfigured()) return null;
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("user_snapshots")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[sync] fetch user failed", error.message);
    return null;
  }
  return (data as UserSnapshot) ?? null;
}

/** Map cloud snapshot payload back into app state fields. */
export function snapshotDataToPartial(
  data: Record<string, unknown>
): Record<string, unknown> {
  return {
    profile: data.profile,
    moj_smisel_zivljenja: data.moj_smisel_zivljenja,
    jaz_sem_status: data.jaz_sem_status,
    identity_locked: data.identity_locked,
    identity_change_log: data.identity_change_log,
    xp_points: data.xp_points,
    status: data.status,
    drift_warnings: data.drift_warnings,
    streak_days: data.streak_days,
    last_streak_date: data.last_streak_date,
    system_locked: data.system_locked,
    drift_handled_date: data.drift_handled_date,
    daily_logs: data.daily_logs,
    weekly_resets: data.weekly_resets,
    next_week_unlocked: data.next_week_unlocked,
    next_week_plan: data.next_week_plan,
    goals: data.goals,
    pillars: data.pillars,
    planner_tasks: data.planner_tasks,
    recurring_tasks: data.recurring_tasks,
    recurring_done: data.recurring_done,
    onboarding_completed: data.onboarding_completed,
    alerted_goals: data.alerted_goals,
    alerted_reminders: data.alerted_reminders,
    chat: data.chat,
  };
}

/** True when cloud has newer data than this device last synced. */
export function cloudIsNewerThanLocal(
  userId: string,
  cloudUpdatedAt: string,
  hasLocalState: boolean
): boolean {
  if (!hasLocalState) return true;
  const localAt = lastCloudSyncAt(userId);
  if (!localAt) return true;
  return new Date(cloudUpdatedAt).getTime() > new Date(localAt).getTime();
}

/** Fetch all user snapshots for the admin panel. */
export async function fetchAllUserSnapshots(): Promise<UserSnapshot[]> {
  if (!isCloudConfigured()) return [];
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("user_snapshots")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[sync] fetch failed", error.message);
    return [];
  }
  return (data ?? []) as UserSnapshot[];
}

/** Convert a cloud snapshot into a StudentRecord for admin display. */
export function snapshotToStudentRecord(snap: UserSnapshot): StudentRecord {
  const d = snap.data;
  const xp = Number(d.xp_points ?? 0);
  const goals = (d.goals as { completed: boolean; specific: string }[]) ?? [];
  const dailyLogs = (d.daily_logs as Record<string, { xp_earned?: number }>) ?? {};

  return {
    user_id: snap.user_id,
    display_name: snap.display_name,
    avatar_url: String((d.profile as { avatar_url?: string })?.avatar_url ?? ""),
    email: snap.email,
    status: (d.status as StudentRecord["status"]) ?? "FLOW",
    xp_points: xp,
    level: levelFromXp(xp),
    weekly_xp: weeklyXpFromLogs(dailyLogs),
    streak_days: Number(d.streak_days ?? 0),
    drift_warnings: Number(d.drift_warnings ?? 0),
    active_goals: goals.filter((g) => !g.completed).map((g) => g.specific),
    sunday_resets_completed: Object.keys(
      (d.weekly_resets as Record<string, unknown>) ?? {}
    ).length,
    locked: Boolean(d.system_locked),
    moj_smisel_zivljenja: String(d.moj_smisel_zivljenja ?? ""),
    jaz_sem_status: String(d.jaz_sem_status ?? ""),
    identity_change_log: (d.identity_change_log as StudentRecord["identity_change_log"]) ?? [],
    calendar_connected: Boolean(
      (d.profile as { calendar_connected?: boolean })?.calendar_connected
    ),
    last_sync_at: snap.updated_at,
    morning_submitted_today: Boolean(d.morning_submitted_today),
    midday_submitted_today: Boolean(d.midday_submitted_today),
    night_submitted_today: Boolean(d.night_submitted_today),
    goals_completed: goals.filter((g) => g.completed).length,
    provider: snap.provider,
  };
}
