import type { PaymentMethod } from "#shared/utils/payment";

export interface ExpenseTemplate {
  id: string;
  name: string;
  /** suggested amount; null = ask each time */
  amount: number | null;
  cat: string;
  note?: string;
  merchant?: string;
  paymentMethod?: PaymentMethod;
}

export type TemplateDraft = Omit<ExpenseTemplate, "id">;
