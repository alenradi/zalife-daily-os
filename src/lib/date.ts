/**
 * Date helpers. Internal logic / ISO formatting only (English).
 *
 * The whole app operates on a FIXED GMT+2 wall clock (per product spec),
 * regardless of the device's local timezone. `Etc/GMT-2` is IANA's name for
 * UTC+2 (the sign is intentionally inverted in the Etc zone family).
 */

const ZONE = "Etc/GMT-2";

/**
 * Returns a Date whose local component getters (getHours, getDay, ...) reflect
 * the current GMT+2 wall-clock time.
 */
export function zonedNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: ZONE }));
}

export function todayISO(d = zonedNow()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ISO date string for `n` days before now (GMT+2). */
export function isoDaysAgo(n: number): string {
  const d = zonedNow();
  d.setDate(d.getDate() - n);
  return todayISO(d);
}

export function isSunday(d = zonedNow()): boolean {
  return d.getDay() === 0;
}

/** ISO week id like "2026-W26". */
export function weekId(d = zonedNow()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export type DayPhase = "morning" | "midday" | "afternoon" | "night";

/** Determine the active daily phase from the GMT+2 hour. */
export function dayPhase(d = zonedNow()): DayPhase {
  const h = d.getHours();
  if (h < HOURS.MIDDAY_OPEN) return "morning";
  if (h < HOURS.MIDDAY_DEADLINE) return "midday";
  if (h < HOURS.NIGHT_OPEN) return "afternoon";
  return "night";
}

export const HOURS = {
  MORNING_BONUS_DEADLINE: 10, // before 10:00 -> bonus XP
  MIDDAY_OPEN: 12, // midday check-in unlocks
  MIDDAY_DEADLINE: 14, // miss -> drift
  NIGHT_OPEN: 20, // night reflection unlocks
  SUNDAY_OPEN: 18, // sunday reset unlocks
};

/** True on Sunday from 18:00 GMT+2 onward. */
export function isSundayResetOpen(d = zonedNow()): boolean {
  return isSunday(d) && d.getHours() >= HOURS.SUNDAY_OPEN;
}

/** Nav target for the mobile bottom bar center slot (changes through the day). */
export function dailyFlowNav(d = zonedNow()): {
  to: string;
  phase: "morning" | "midday" | "night";
  icon: string;
} {
  const h = d.getHours();
  if (h >= HOURS.NIGHT_OPEN) {
    return { to: "/night", phase: "night", icon: "☾" };
  }
  if (h >= HOURS.MIDDAY_OPEN) {
    return { to: "/midday", phase: "midday", icon: "◐" };
  }
  return { to: "/morning", phase: "morning", icon: "☀" };
}

export function pastMiddayDeadline(d = zonedNow()): boolean {
  return d.getHours() >= HOURS.MIDDAY_DEADLINE;
}

/** Current GMT+2 hour (0-23). */
export function zonedHour(): number {
  return zonedNow().getHours();
}

export function lastNDates(n: number, from = zonedNow()): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const dt = new Date(from);
    dt.setDate(from.getDate() - i);
    out.push(todayISO(dt));
  }
  return out;
}

// ---- Slovenian display helpers --------------------------------------------

export const SL_DAYS_SHORT = ["NED", "PON", "TOR", "SRE", "ČET", "PET", "SOB"];
export const SL_DAYS_LONG = [
  "Nedelja",
  "Ponedeljek",
  "Torek",
  "Sreda",
  "Četrtek",
  "Petek",
  "Sobota",
];
export const SL_MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "maj",
  "jun",
  "jul",
  "avg",
  "sep",
  "okt",
  "nov",
  "dec",
];

/** "Torek, 16. jun" */
export function formatSlDate(d = zonedNow()): string {
  return `${SL_DAYS_LONG[d.getDay()]}, ${d.getDate()}. ${SL_MONTHS[d.getMonth()]}`;
}

/** "16:35:02" GMT+2 */
export function formatClock(d = zonedNow()): string {
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

/** Monday-first ISO dates for the calendar week after the current one. */
export function nextWeekDates(from = zonedNow()): { iso: string; dayIndex: number }[] {
  const day = from.getDay();
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;
  const monday = new Date(from);
  monday.setDate(from.getDate() + daysUntilNextMonday);
  return weekDates(monday);
}

/** Monday-first list of {iso, dayIndex} for the week containing `ref`. */
export function weekDates(ref = zonedNow()): { iso: string; dayIndex: number }[] {
  const monday = new Date(ref);
  const offset = (ref.getDay() + 6) % 7; // 0 = Monday
  monday.setDate(ref.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { iso: todayISO(d), dayIndex: d.getDay() };
  });
}
