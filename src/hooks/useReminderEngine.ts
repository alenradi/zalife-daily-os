import { useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { todayISO, zonedHour, HOURS } from "../lib/date";
import {
  cycleMiss,
  overduePlannerTasks,
  pickIdentityVision,
  reminderKey,
  wasAlertedToday,
} from "../lib/reminders";

/**
 * Proactive Mindset Reminder Engine.
 *
 * Periodically interrupts autopilot with a single, throttled modal:
 *   1. SMART goal deadlines
 *   2. Overdue planner tasks (past scheduled start time)
 *   3. Missed daily cycle steps (morning / midday / night)
 *   4. Open Top-3 priority tasks in the afternoon
 *   5. Identity alignment from Mapa sub-areas
 */
const TICK_MS = 30 * 1000;
const INITIAL_DELAY_MS = 90 * 1000;
const REMINDER_GAP_MS = 12 * 60 * 1000;
const GOAL_DEADLINE_WINDOW_DAYS = 2;

function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const today = new Date(todayISO() + "T00:00:00");
  const due = new Date(iso + "T00:00:00");
  if (Number.isNaN(due.getTime())) return null;
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function useReminderEngine() {
  const mountedAt = useRef<number>(Date.now());

  useEffect(() => {
    const tick = () => {
      const s = useAppStore.getState();

      if (s.modals.length > 0 || s.system_locked) return;
      if (Date.now() - mountedAt.current < INITIAL_DELAY_MS) return;
      if (s.last_reminder_at && Date.now() - s.last_reminder_at < REMINDER_GAP_MS)
        return;

      const today = todayISO();
      const fire = (
        kind: string,
        alertId: string,
        modalKind: "deadline" | "identity_check",
        payload: Record<string, unknown>
      ) => {
        s.markReminderAlerted(reminderKey(kind, alertId));
        s.noteReminderShown();
        s.pushModal(modalKind, payload);
      };

      // 1) Closing SMART goal deadlines (once per goal per day).
      const dueGoal = s.goals
        .filter((g) => !g.completed && g.time_relevant)
        .map((g) => ({ g, d: daysUntil(g.time_relevant) }))
        .filter(
          ({ g, d }) =>
            d !== null &&
            d <= GOAL_DEADLINE_WINDOW_DAYS &&
            s.alerted_goals[g.id] !== today
        )
        .sort((a, b) => (a.d ?? 0) - (b.d ?? 0))[0];

      if (dueGoal) {
        const { g, d } = dueGoal;
        s.markGoalAlerted(g.id);
        s.noteReminderShown();
        s.pushModal("deadline", {
          variant: "goal",
          title: g.specific,
          days: d,
        });
        return;
      }

      // 2) Planner tasks past their scheduled start time today.
      const overdue = overduePlannerTasks(s, today);
      if (
        overdue.length > 0 &&
        !wasAlertedToday(s.alerted_reminders, "planner", "batch")
      ) {
        fire("planner", "batch", "deadline", {
          variant: "planner",
          tasks: overdue.map((t) => t.title || t.task_description || "Naloga"),
        });
        return;
      }

      // 3) Missed daily cycle step (morning / midday / night).
      const miss = cycleMiss(s, today);
      if (miss && !wasAlertedToday(s.alerted_reminders, "cycle", miss)) {
        fire("cycle", miss, "deadline", { variant: "cycle", phase: miss });
        return;
      }

      // 4) Open Top-3 priority tasks after midday deadline.
      const log = s.daily_logs[today];
      const openPriority =
        zonedHour() >= HOURS.MIDDAY_DEADLINE &&
        (log?.morning?.top_tasks.filter((t) => !t.completed) ?? []);
      if (
        openPriority &&
        openPriority.length > 0 &&
        !wasAlertedToday(s.alerted_reminders, "top3", "batch")
      ) {
        fire("top3", "batch", "deadline", {
          variant: "task",
          tasks: openPriority.map((t) => t.title),
        });
        return;
      }

      // 5) Identity alignment from Mapa sub-areas or pillar vision.
      const identity = pickIdentityVision(s);
      if (
        identity &&
        !wasAlertedToday(s.alerted_reminders, "identity", "random")
      ) {
        fire("identity", "random", "identity_check", {
          pillarTitle: identity.pillarTitle,
          vision: identity.vision,
        });
      }
    };

    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, []);
}
