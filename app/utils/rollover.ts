const round2 = (n: number) => Math.round(n * 100) / 100;
const MAX_MONTHS_BACK = 240; // a safety cap: 20 years of carry-over

/**
 * Category budget rollover (opt-in). Unused budget carries into the next month, starting from `since` (the month the person
 * turned rollover on; the past is never rewritten). Overspending is NOT carried: a month that went over starts the next one at its
 * plain budget. The month a person turned it on has no carry-over yet. Months before `since` have none.
 *
 *   available(month) = base + carry(month)
 *   carry(first month) = 0
 *   carry(next)        = max(0, available(month) - spent(month))
 *
 * The base is the category's current budget for every month: past bases are not stored.
 */
export const rolloverFor = (opts: {
  base: number;
  /** what was spent in the category in a month */
  spentIn: (y: number, m: number) => number;
  since: { y: number; m: number };
  y: number;
  m: number;
}): { rollover: number; available: number } => {
  const target = opts.y * 12 + opts.m;
  const first = Math.max(opts.since.y * 12 + opts.since.m, target - MAX_MONTHS_BACK);
  let carry = 0;
  for (let i = first; i < target; i++) {
    const available = opts.base + carry;
    carry = Math.max(0, round2(available - opts.spentIn(Math.floor(i / 12), i % 12)));
  }
  return { rollover: round2(carry), available: round2(opts.base + carry) };
};
