import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { todayISO, pastMiddayDeadline, zonedHour, HOURS } from "../lib/date";

/**
 * Background watcher implementing the Drift Status Protocol.
 * Drops the user to DRIFT immediately when:
 *  - the midday check-in was missed before 14:00, or
 *  - the day's Top-3 priority actions remain unmet after the night window opens.
 *
 * It will NOT re-trigger for a condition already handled today (the user wrote a
 * recovery plan and returned to Flow) — this fixes a runaway lock loop where the
 * same missed window pushed the user to 5/5 warnings within minutes.
 */
export function useDriftWatcher() {
  const triggerDrift = useAppStore((s) => s.triggerDrift);

  useEffect(() => {
    const evaluate = () => {
      const state = useAppStore.getState();
      if (state.status === "DRIFT" || state.system_locked) return;

      const today = state.daily_logs[todayISO()];
      const hasMorning = !!today?.morning?.submitted;
      // Once the user has consciously recovered today, don't relapse them
      // automatically for the same kind of miss on the same day.
      const handledToday = state.drift_handled_date === todayISO();
      if (!hasMorning || handledToday) return;

      // Rule 1: midday check-in missed before the 14:00 deadline.
      const middayMissed = pastMiddayDeadline() && !today?.midday?.submitted;

      // Rule 2: priority Top-3 actions still open after the night window opens.
      const openPriority =
        zonedHour() >= HOURS.NIGHT_OPEN &&
        (today?.morning?.top_tasks.some((t) => !t.completed) ?? false);

      if (middayMissed || openPriority) {
        triggerDrift();
      }
    };

    evaluate();
    const id = window.setInterval(evaluate, 60 * 1000);
    return () => window.clearInterval(id);
  }, [triggerDrift]);
}
