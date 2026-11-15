/**
 * Equal split in whole cents: every share is floor(total / n), and the leftover cents go one each to the first shares,
 * so the shares ALWAYS add up to exactly the amount (e.g. 100.00 / 3 = 33.34 + 33.33 + 33.33).
 */
export function splitEqual(amount: number, count: number): number[] {
  if (!Number.isInteger(count) || count < 1) return [];
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / count);
  const extra = cents - base * count;
  return Array.from({ length: count }, (_, i) => (base + (i < extra ? 1 : 0)) / 100);
}
