import type { IncomeSource } from "#shared/utils/income";

export interface Income {
  id: number;
  amount: number;
  y: number;
  m: number;
  day: number;
  source: IncomeSource;
  note?: string;
}

/** What the income form hands back. `date` is YYYY-MM-DD. */
export interface IncomeDraft {
  amount: number;
  source: IncomeSource;
  date: string;
  note: string;
}
