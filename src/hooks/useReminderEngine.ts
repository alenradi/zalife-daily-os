import { useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { PILLARS } from "../data/pillars";
import { todayISO, zonedHour, HOURS } from "../lib/date";

/**
 * Proactive Mindset Reminder Engine.
 *
 * Periodically interrupts autopilot behaviour with a single, throttled modal:
 *   1. Deadline alerts — closing SMART goals + still-open daily priority tasks.
 *   2. Identity alerts — reflect a stored Future Self vision from a pillar and
 *      ask whether current actions match it (alignment XP on confirmation).
 *
 * Only one reminder fires per gap, never while another modal is open, and goal
 * deadline alerts fire at most once per goal per day.
 */
const TICK_MS = 30 * 1000;
const INITIAL_DELAY_MS = 90 * 1000; // let the user settle in first
const REMINDER_GAP_MS = 12 * 60 * 1000; // min spacing between reminders
const GOAL_DEADLINE_WINDOW_DAYS = 2; // alert when a goal closes within 2 days

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

      // Never stack on top of another modal or a locked system.
      if (s.modals.length > 0 || s.system_locked) return;
      if (Date.now() - mountedAt.current < INITIAL_DELAY_MS) return;
      if (s.last_reminder_at && Date.now() - s.last_reminder_at < REMINDER_GAP_MS)
        return;

      const today = todayISO();

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

      // 2) Open daily priority tasks in the afternoon/evening.
      const log = s.daily_logs[today];
      const openPriority =
        zonedHour() >= HOURS.MIDDAY_DEADLINE &&
        (log?.morning?.top_tasks.filter((t) => !t.completed) ?? []);
      if (openPriority && openPriority.length > 0) {
        s.noteReminderShown();
        s.pushModal("deadline", {
          variant: "task",
          tasks: openPriority.map((t) => t.title),
        });
        return;
      }

      // 3) Identity alignment check from a stored Future Self vision.
      const withVision = s.pillars.filter(
        (p) => p.future_self_identity.trim().length > 0
      );
      if (withVision.length > 0) {
        const pick = withVision[Math.floor(Math.random() * withVision.length)];
        const def = PILLARS.find((p) => p.id === pick.pillar_id);
        s.noteReminderShown();
        s.pushModal("identity_check", {
          pillarTitle: def?.title ?? "",
          vision: pick.future_self_identity,
        });
      }
    };

    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, []);
}
