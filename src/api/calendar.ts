/**
 * Google Calendar integration.
 *
 * One-button connect via Google Identity Services (see ../lib/google), then
 * tasks from Morning Planner (Top 3) and the Tasks page sync to Calendar.
 */

import type { PlannerTask, Task } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";
import {
  createCalendarEvent,
  fetchGoogleUser,
  listCalendarEvents,
  requestGoogleAccess,
  isGoogleConfigured,
  type GoogleCalendarEvent,
} from "../lib/google";

export interface CalendarConnectionResult {
  connected: boolean;
  account?: string;
}

export interface SyncResult {
  created: number;
  failed: number;
  needsReconnect: boolean;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  needsReconnect: boolean;
}

function dayBoundsISO(dateISO: string): { timeMin: string; timeMax: string } {
  return {
    timeMin: `${dateISO}T00:00:00+02:00`,
    timeMax: `${dateISO}T23:59:59+02:00`,
  };
}

function eventDurationMinutes(ev: GoogleCalendarEvent): number {
  const start = ev.start.dateTime
    ? new Date(ev.start.dateTime)
    : new Date(`${ev.start.date ?? ""}T09:00:00+02:00`);
  const end = ev.end.dateTime
    ? new Date(ev.end.dateTime)
    : new Date(`${ev.end.date ?? ev.start.date ?? ""}T10:00:00+02:00`);
  const mins = Math.round((end.getTime() - start.getTime()) / 60_000);
  return Math.max(15, Math.min(480, mins || 30));
}

function eventTitle(ev: GoogleCalendarEvent): string {
  return (ev.summary || "Brez naslova").replace(/^🔥\s*/, "").trim();
}

/** Pull Google Calendar events for one day into planner tasks. */
export async function importCalendarDay(dateISO: string): Promise<ImportResult> {
  const auth = useAuthStore.getState();
  if (!auth.hasValidGoogleToken()) {
    return { imported: 0, skipped: 0, needsReconnect: true };
  }

  const token = auth.google_token!.access_token;
  const { timeMin, timeMax } = dayBoundsISO(dateISO);

  try {
    const events = await listCalendarEvents(token, timeMin, timeMax);
    const incoming = events.map((ev) => ({
      title: eventTitle(ev),
      duration_minutes: eventDurationMinutes(ev),
      priority: ev.summary?.startsWith("🔥") ?? false,
      recurring: false,
      calendar_event_id: ev.id,
      from_calendar: true,
      task_description: ev.description?.split("\n")[0] ?? "",
    }));
    const { added, skipped } =
      useAppStore.getState().mergeCalendarTasksForDay(dateISO, incoming);
    if (added > 0) useAppStore.getState().connectCalendar();
    return { imported: added, skipped, needsReconnect: false };
  } catch (err) {
    console.error("[calendar] import failed", err);
    return { imported: 0, skipped: 0, needsReconnect: true };
  }
}

/**
 * Triggers the Google consent popup (identity + calendar.events scope),
 * stores the token, and returns the connected account email.
 */
export async function connectGoogleCalendar(): Promise<CalendarConnectionResult> {
  const token = await requestGoogleAccess();
  useAuthStore.getState().setGoogleToken(token);
  try {
    const user = await fetchGoogleUser(token.access_token);
    useAppStore.getState().updateProfile({
      calendar_connected: true,
      calendar_email: user.email,
    });
    return { connected: true, account: user.email };
  } catch {
    useAppStore.getState().connectCalendar();
    return { connected: true };
  }
}

export { isGoogleConfigured };

/** True when we have a live Google token ready to create calendar events. */
export function canSyncCalendar(): boolean {
  return useAuthStore.getState().hasValidGoogleToken();
}

/**
 * Schedule tasks sequentially and push them to the primary Google Calendar.
 * Works for Morning Top-3 and Tasks-page planner items.
 */
export async function syncTasksToCalendar(
  tasks: Task[],
  dateISO: string,
  startHour = 9,
  source: "morning" | "tasks" = "morning"
): Promise<SyncResult> {
  const auth = useAuthStore.getState();
  if (!auth.hasValidGoogleToken()) {
    return { created: 0, failed: 0, needsReconnect: true };
  }
  const token = auth.google_token!.access_token;

  const label =
    source === "morning"
      ? "ZaLife Daily OS — dnevna prioriteta (Top 3)."
      : "ZaLife Daily OS — naloga iz tedenskega načrta.";

  let cursor = new Date(`${dateISO}T${String(startHour).padStart(2, "0")}:00:00`);
  let created = 0;
  let failed = 0;

  for (const task of tasks) {
    if (!task.title.trim() || task.completed) continue;
    const start = new Date(cursor);
    const end = new Date(start.getTime() + task.duration_minutes * 60_000);
    try {
      await createCalendarEvent(token, {
        summary: `🔥 ${task.title}`,
        description: `${label}\nOstani voditelj svojega življenja.`,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
      });
      created++;
    } catch (err) {
      console.error("[calendar] failed to sync task", task.id, err);
      failed++;
    }
    cursor = new Date(end.getTime() + 15 * 60_000);
  }

  if (created > 0) {
    useAppStore.getState().connectCalendar();
  }

  return { created, failed, needsReconnect: false };
}

/** Sync all open planner tasks for a given day (Tasks page). */
export async function syncPlannerDayToCalendar(
  tasks: PlannerTask[],
  dateISO: string,
  startHour = 9
): Promise<SyncResult> {
  const asTasks: Task[] = tasks
    .filter((t) => !t.completed)
    .map((t) => ({
      id: t.id,
      title: t.title,
      duration_minutes: t.duration_minutes,
      completed: false,
    }));
  return syncTasksToCalendar(asTasks, dateISO, startHour, "tasks");
}
