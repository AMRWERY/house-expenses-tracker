/** How an expense was paid: a label only. The app never stores card numbers or bank details. */
export const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "wallet"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const isPaymentMethod = (v: unknown): v is PaymentMethod =>
  typeof v === "string" && (PAYMENT_METHODS as readonly string[]).includes(v);
