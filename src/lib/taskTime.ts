/** Local time helpers for planner tasks (GMT+2 app clock, stored as HH:mm). */

export function parseTimeHM(value: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

export function formatTimeHM(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function minutesFromHM(value: string): number {
  const p = parseTimeHM(value);
  if (!p) return 0;
  return p.h * 60 + p.m;
}

export function durationFromRange(start: string, end: string): number {
  const a = minutesFromHM(start);
  const b = minutesFromHM(end);
  if (!a || !b || b <= a) return 30;
  return b - a;
}

export function addMinutesToHM(value: string, add: number): string {
  const p = parseTimeHM(value);
  if (!p) return value;
  const total = p.h * 60 + p.m + add;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return formatTimeHM(h, m);
}

export function formatTimeRange(start?: string, end?: string): string {
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  return "";
}

/** ISO datetime → HH:mm in Europe/Ljubljana-style offset (+02:00). */
export function hmFromISO(iso: string, dateISO: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    // Use local browser TZ (user is GMT+2 per product spec).
    const h = d.getHours();
    const m = d.getMinutes();
    return formatTimeHM(h, m);
  } catch {
    if (iso.includes("T")) {
      const part = iso.split("T")[1]?.slice(0, 5);
      return part && /^\d{2}:\d{2}$/.test(part) ? part : "";
    }
    return dateISO === iso.slice(0, 10) ? "09:00" : "";
  }
}

export function defaultSlotForDay(
  existingStarts: string[],
  durationMin = 60
): { start: string; end: string } {
  let startMin = 9 * 60;
  for (const s of existingStarts) {
    const p = parseTimeHM(s);
    if (p) startMin = Math.max(startMin, p.h * 60 + p.m + durationMin);
  }
  const h = Math.floor(startMin / 60);
  const m = startMin % 60;
  const start = formatTimeHM(h, m);
  const end = addMinutesToHM(start, durationMin);
  return { start, end };
}

export function dateTimeISO(dateISO: string, hm: string): string {
  const p = parseTimeHM(hm);
  if (!p) return `${dateISO}T09:00:00`;
  return `${dateISO}T${formatTimeHM(p.h, p.m)}:00`;
}

export function sortKeyForTask(t: {
  start_time?: string;
  priority?: boolean;
  isTop3?: boolean;
}): number {
  if (t.isTop3) return -1;
  if (t.start_time) return minutesFromHM(t.start_time);
  return 24 * 60 + (t.priority ? 0 : 60);
}
