import type { Frequency } from "#shared/utils/recurrence";
import type { PaymentMethod } from "#shared/utils/payment";

/** A recurring expense rule as the server sends it. `nextDue` is the occurrence waiting for confirmation. */
export interface Recurring {
  id: string;
  title: string;
  amount: number;
  cat: string;
  note?: string;
  merchant?: string;
  paymentMethod?: PaymentMethod;
  frequency: Frequency;
  interval: number;
  startDate: string;
  nextDue: string | null;
  endDate: string | null;
  active: boolean;
  remindDaysBefore: number;
  lastRemindedFor: string | null;
}

/** What the rule form hands back (`endDate` empty = never ends). */
export interface RecurringDraft {
  title: string;
  amount: number;
  cat: string;
  note: string;
  merchant: string;
  paymentMethod: PaymentMethod | null;
  frequency: Frequency;
  interval: number;
  startDate: string;
  endDate: string;
  remindDaysBefore: number;
}

export type RecurringView =
  | { view: "list" }
  | { view: "form"; rule?: Recurring }
  | { view: "confirm"; rule: Recurring };
