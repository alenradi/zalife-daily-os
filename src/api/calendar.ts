/**
 * Google Calendar integration — timed tasks, import/export, day overview sync.
 */

import type { PlannerTask, Task } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";
import {
  createCalendarEvent,
  fetchGoogleUser,
  listCalendarEvents,
  requestGoogleAccess,
  updateCalendarEvent,
  isGoogleConfigured,
  type GoogleCalendarEvent,
} from "../lib/google";
import {
  dateTimeISO,
  durationFromRange,
  hmFromISO,
} from "../lib/taskTime";

export interface CalendarConnectionResult {
  connected: boolean;
  account?: string;
}

export interface SyncResult {
  created: number;
  updated: number;
  failed: number;
  needsReconnect: boolean;
}

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  needsReconnect: boolean;
}

function dayBoundsISO(dateISO: string): { timeMin: string; timeMax: string } {
  return {
    timeMin: `${dateISO}T00:00:00+02:00`,
    timeMax: `${dateISO}T23:59:59+02:00`,
  };
}

function eventTimes(
  ev: GoogleCalendarEvent,
  dateISO: string
): { start: string; end: string; duration: number } {
  const startIso = ev.start.dateTime ?? `${ev.start.date ?? dateISO}T09:00:00+02:00`;
  const endIso =
    ev.end.dateTime ??
    `${ev.end.date ?? ev.start.date ?? dateISO}T10:00:00+02:00`;
  const start = hmFromISO(startIso, dateISO) || "09:00";
  const end = hmFromISO(endIso, dateISO) || "10:00";
  const duration = durationFromRange(start, end);
  return { start, end, duration: duration || 30 };
}

function eventTitle(ev: GoogleCalendarEvent): string {
  return (ev.summary || "Brez naslova").replace(/^🔥\s*/, "").trim();
}

function taskWindow(task: PlannerTask, dateISO: string): {
  startISO: string;
  endISO: string;
} {
  if (task.start_time && task.end_time) {
    return {
      startISO: new Date(dateTimeISO(dateISO, task.start_time)).toISOString(),
      endISO: new Date(dateTimeISO(dateISO, task.end_time)).toISOString(),
    };
  }
  const start = new Date(`${dateISO}T09:00:00`);
  const end = new Date(start.getTime() + task.duration_minutes * 60_000);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

const CAL_DESC = "ZaLife Daily OS — naloga iz načrta izvedbe.";

/** Pull Google Calendar events for one day into planner tasks (with times). */
export async function importCalendarDay(dateISO: string): Promise<ImportResult> {
  const auth = useAuthStore.getState();
  if (!auth.hasValidGoogleToken()) {
    return { imported: 0, updated: 0, skipped: 0, needsReconnect: true };
  }

  const token = auth.google_token!.access_token;
  const { timeMin, timeMax } = dayBoundsISO(dateISO);

  try {
    const events = await listCalendarEvents(token, timeMin, timeMax);
    const incoming = events.map((ev) => {
      const { start, end, duration } = eventTimes(ev, dateISO);
      return {
        title: eventTitle(ev),
        duration_minutes: duration,
        start_time: start,
        end_time: end,
        priority: ev.summary?.startsWith("🔥") ?? false,
        calendar_event_id: ev.id,
        from_calendar: true,
        task_description: ev.description?.split("\n")[0] ?? "",
      };
    });
    const { added, updated, skipped } =
      useAppStore.getState().mergeCalendarTasksForDay(dateISO, incoming);
    if (added > 0 || updated > 0) useAppStore.getState().connectCalendar();
    return { imported: added, updated, skipped, needsReconnect: false };
  } catch (err) {
    console.error("[calendar] import failed", err);
    return { imported: 0, updated: 0, skipped: 0, needsReconnect: true };
  }
}

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

export function canSyncCalendar(): boolean {
  return useAuthStore.getState().hasValidGoogleToken();
}

/** Push one planner task to Google Calendar; stores event id on the task. */
export async function syncPlannerTaskToCalendar(
  task: PlannerTask,
  dateISO: string
): Promise<{ ok: boolean; needsReconnect: boolean }> {
  const auth = useAuthStore.getState();
  if (!auth.hasValidGoogleToken()) {
    return { ok: false, needsReconnect: true };
  }
  const token = auth.google_token!.access_token;
  const { startISO, endISO } = taskWindow(task, dateISO);
  const payload = {
    summary: task.priority ? `🔥 ${task.title}` : task.title,
    description: CAL_DESC,
    startISO,
    endISO,
  };

  try {
    if (task.calendar_event_id) {
      await updateCalendarEvent(token, task.calendar_event_id, payload);
    } else {
      const ev = await createCalendarEvent(token, payload);
      useAppStore.getState().updatePlannerTask(dateISO, task.id, {
        calendar_event_id: ev.id,
      });
    }
    useAppStore.getState().connectCalendar();
    return { ok: true, needsReconnect: false };
  } catch (err) {
    console.error("[calendar] sync task failed", task.id, err);
    return { ok: false, needsReconnect: true };
  }
}

export async function syncTasksToCalendar(
  tasks: Task[],
  dateISO: string,
  startHour = 9,
  source: "morning" | "tasks" = "morning"
): Promise<SyncResult> {
  const auth = useAuthStore.getState();
  if (!auth.hasValidGoogleToken()) {
    return { created: 0, updated: 0, failed: 0, needsReconnect: true };
  }
  const token = auth.google_token!.access_token;

  const label =
    source === "morning"
      ? "ZaLife Daily OS — dnevna prioriteta (Top 3)."
      : CAL_DESC;

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

  if (created > 0) useAppStore.getState().connectCalendar();
  return { created, updated: 0, failed, needsReconnect: false };
}

/** Sync all open planner tasks for a day using each task's time slot. */
export async function syncPlannerDayToCalendar(
  tasks: PlannerTask[],
  dateISO: string
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const t of tasks.filter((x) => !x.completed && !x.from_calendar)) {
    const res = await syncPlannerTaskToCalendar(t, dateISO);
    if (res.ok) {
      if (t.calendar_event_id) updated++;
      else created++;
    } else if (res.needsReconnect) {
      return { created, updated, failed, needsReconnect: true };
    } else failed++;
  }

  return { created, updated, failed, needsReconnect: false };
}
