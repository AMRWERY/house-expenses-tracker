export type ThemeMode = 'light' | 'dark' | 'system'

export interface MonthSummary {
  key: string;
  y: number;
  m: number;
  total: number;
  /** bar width, 0-100 (relative to the biggest month) */
  pct: number;
  topCat: CategoryKey;
  /** the month in progress (its total is "so far", so it has no comparison) */
  isCurrent: boolean;
  /** % change vs the month before; null when there is nothing to compare */
  delta: number | null;
}
