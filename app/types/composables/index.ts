export type ThemeMode = 'light' | 'dark'

export interface MonthSummary {
  key: string;
  y: number;
  m: number;
  total: number;
  /** bar width, 0-100: the share of the main amount spent, or (no main amount) relative to the biggest month */
  pct: number;
  /** the main amount set for this month; null when none was set */
  amount: number | null;
  /** main amount minus spent (negative = over); null when there is no main amount */
  left: number | null;
  topCat: string;
  /** the month in progress (its total is "so far", so it has no comparison) */
  isCurrent: boolean;
  /** % change vs the calendar month before; null unless deltaState is 'pct' */
  delta: number | null;
  /** 'pct' = a percentage; 'new' = the month before had no expenses (no percentage); 'none' = nothing to compare */
  deltaState: 'pct' | 'new' | 'none';
}
