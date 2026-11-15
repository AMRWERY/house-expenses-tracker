/**
 * Recurring-schedule maths on plain YYYY-MM-DD strings (no time zones: a date is a calendar day).
 * Used by the app (what is due) and the server (validating a confirmation), so both always agree.
 */
export const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m1: number, d: number) => `${y}-${pad(m1)}-${pad(d)}`;
const daysIn = (y: number, m1: number) => new Date(Date.UTC(y, m1, 0)).getUTCDate();

export function parseISO(s: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return m >= 1 && m <= 12 && d >= 1 && d <= daysIn(y, m) ? { y, m, d } : null; // rejects 31 Feb
}
export const isValidISODate = (s: string) => parseISO(s) !== null;

export function addDays(date: string, n: number): string {
  const p = parseISO(date)!;
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d) + n * DAY_MS);
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/**
 * The occurrence after `date`. `anchorDay` is the day of the month the rule started on: a rule on the 31st
 * falls on the last day of shorter months and goes back to the 31st afterwards; a yearly 29 Feb falls on 28 Feb
 * in common years.
 */
export function nextOccurrence(date: string, frequency: Frequency, interval: number, anchorDay: number): string {
  const p = parseISO(date)!;
  if (frequency === "daily") return addDays(date, interval);
  if (frequency === "weekly") return addDays(date, interval * 7);
  if (frequency === "monthly") {
    const total = p.y * 12 + (p.m - 1) + interval;
    const y = Math.floor(total / 12);
    const m1 = (total % 12) + 1;
    return iso(y, m1, Math.min(anchorDay, daysIn(y, m1)));
  }
  const y = p.y + interval;
  return iso(y, p.m, Math.min(anchorDay, daysIn(y, p.m)));
}

const MAX_STEPS = 60_000; // daily over 100 years is about 36,500
const MAX_DATE = "2100-12-31";

/** The first occurrence on or after `min` (never before the start date). Null when the schedule runs past `end` / the supported range. */
export function firstOnOrAfter(
  start: string,
  frequency: Frequency,
  interval: number,
  min: string,
  end?: string | null,
): string | null {
  const anchorDay = parseISO(start)!.d;
  let d = start;
  for (let i = 0; i < MAX_STEPS && d < min; i++) d = nextOccurrence(d, frequency, interval, anchorDay);
  if (d < min || d > MAX_DATE || (end && d > end)) return null;
  return d;
}

/** The occurrence after `current`, or null when it falls after the end date (the rule is finished). */
export function advance(
  current: string,
  start: string,
  frequency: Frequency,
  interval: number,
  end?: string | null,
): string | null {
  const next = nextOccurrence(current, frequency, interval, parseISO(start)!.d);
  return next > MAX_DATE || (end && next > end) ? null : next;
}

/** Is `candidate` one of the rule's scheduled dates? */
export function isScheduledDate(
  start: string,
  frequency: Frequency,
  interval: number,
  candidate: string,
  end?: string | null,
): boolean {
  return firstOnOrAfter(start, frequency, interval, candidate, end) === candidate;
}

export type DueStatus = "overdue" | "today" | "upcoming";
export const dueStatus = (nextDue: string, today: string): DueStatus =>
  nextDue < today ? "overdue" : nextDue === today ? "today" : "upcoming";

/** Should an in-app reminder show? From `remindDaysBefore` days before the due date until it is handled. */
export const reminderActive = (nextDue: string, remindDaysBefore: number, today: string) =>
  addDays(nextDue, -remindDaysBefore) <= today;

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  const a = parseISO(from)!;
  const b = parseISO(to)!;
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / DAY_MS);
}
