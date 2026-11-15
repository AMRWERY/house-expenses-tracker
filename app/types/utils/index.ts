import type { PaymentMethod } from "#shared/utils/payment";

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
  /** where it was bought (optional) */
  merchant?: string;
  /** how it was paid (optional): a label only */
  paymentMethod?: PaymentMethod;
  /** a receipt photo is stored for this expense */
  hasReceipt?: boolean;
  /** shared households: who recorded it and who paid (user ids; absent for a former member) */
  createdBy?: string;
  paidBy?: string;
  /** shared households: who shares the cost, how much each owes, and whether it is settled */
  split?: ExpenseSplitShare[];
}

export interface ExpenseSplitShare {
  userId: string;
  share: number;
  settled: boolean;
}

/** What the Add/Edit sheet hands back. `date` is YYYY-MM-DD. */
export interface ExpenseDraft {
  amount: number;
  cat: string;
  date: string;
  note: string;
  merchant: string;
  paymentMethod: PaymentMethod | null;
  /** shared households: who paid (default: you) and who shares the cost (empty = not split) */
  paidBy?: string;
  splitWith?: string[];
}

export interface ExpenseRecord {
  id: number
  cat: string
  amount: number
  y: number
  m: number
  day: number
  note?: string
  merchant?: string
  paymentMethod?: PaymentMethod
  hasReceipt?: boolean
  createdBy?: string
  paidBy?: string
  split?: ExpenseSplitShare[]
}