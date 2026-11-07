export interface Expense {
  id: number;
  /** i18n key, only for the built-in sample data */
  titleKey?: string;
  /** user-written note; also used as the row title */
  note?: string;
  /** a built-in category key, or the id of one of the person's custom categories */
  cat: string;
  amount: number;
  y: number;
  m: number;
  day: number;
}

/** What the Add/Edit sheet hands back. `date` is YYYY-MM-DD. */
export interface ExpenseDraft {
  amount: number;
  cat: string;
  date: string;
  note: string;
}

export interface ExpenseRecord {
  id: number
  cat: string
  amount: number
  y: number
  m: number
  day: number
  note?: string
}