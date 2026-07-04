import { PILLARS } from "../data/pillars";
import { HOURS, todayISO, zonedHour, zonedNow } from "./date";
import { minutesFromHM } from "./taskTime";
import type { PlannerTask } from "../types";
import type { AppState } from "../store/useAppStore";

export function reminderKey(kind: string, id: string, date = todayISO()): string {
  return `${kind}:${id}:${date}`;
}

export function wasAlertedToday(
  alerted: Record<string, string>,
  kind: string,
  id: string
): boolean {
  return alerted[reminderKey(kind, id)] === todayISO();
}

export function overduePlannerTasks(state: AppState, today = todayISO()): PlannerTask[] {
  const nowMin = zonedNow().getHours() * 60 + zonedNow().getMinutes();
  const doneRecurring = new Set(state.recurring_done[today] ?? []);
  const oneOff = (state.planner_tasks[today] ?? []).filter((t) => !t.completed);
  const recurring = state.recurring_tasks.filter((t) => !doneRecurring.has(t.id));
  const all = [...oneOff, ...recurring];

  return all.filter((t) => {
    if (!t.start_time) return false;
    const startMin = minutesFromHM(t.start_time);
    return startMin > 0 && startMin <= nowMin;
  });
}

export function pickIdentityVision(state: AppState): {
  pillarTitle: string;
  vision: string;
} | null {
  const subAreas = state.pillars.flatMap((p) => {
    const def = PILLARS.find((x) => x.id === p.pillar_id);
    return p.metrics
      .filter((m) => m.jaz_sem?.trim())
      .map((m) => ({
        pillarTitle: def?.title ?? "",
        metricLabel: def?.metrics.find((x) => x.key === m.key)?.label ?? "",
        vision: m.jaz_sem.trim(),
      }));
  });

  if (subAreas.length > 0) {
    const pick = subAreas[Math.floor(Math.random() * subAreas.length)];
    return {
      pillarTitle: `${pick.pillarTitle} — ${pick.metricLabel}`,
      vision: pick.vision,
    };
  }

  const withPillar = state.pillars.filter((p) => p.future_self_identity.trim());
  if (withPillar.length === 0) return null;
  const pick = withPillar[Math.floor(Math.random() * withPillar.length)];
  const def = PILLARS.find((p) => p.id === pick.pillar_id);
  return { pillarTitle: def?.title ?? "", vision: pick.future_self_identity.trim() };
}

export function cycleMiss(state: AppState, today = todayISO()):
  | "morning"
  | "midday"
  | "night"
  | null {
  const log = state.daily_logs[today];
  const h = zonedHour();

  if (h >= HOURS.MORNING_BONUS_DEADLINE && !log?.morning?.submitted) {
    return "morning";
  }
  if (h >= HOURS.MIDDAY_OPEN && !log?.midday?.submitted) {
    return "midday";
  }
  if (h >= HOURS.NIGHT_OPEN && !log?.night?.submitted) {
    return "night";
  }
  return null;
}
