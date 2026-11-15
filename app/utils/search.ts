/** Expense search: free text over note and merchant, partial amount, and an optional min/max amount. */
export interface SearchFilter {
  q: string;
  min: number | null;
  max: number | null;
}

interface Searchable {
  amount: number;
  note?: string;
  merchant?: string;
  /** the translated name of the payment method, so "cash" / "نقدًا" can be searched */
  paymentLabel?: string;
}

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

/** Latin digits, "." as the decimal mark, lowercase, no Arabic diacritics: so "٢٥٠" finds 250 and "قهوة" ignores marks. */
export function normalizeText(s: string) {
  return s
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .toLowerCase()
    .trim();
}

/** Parse an amount typed in a filter box; empty or invalid = no limit. */
export function parseAmountBound(s: string): number | null {
  const n = Number(normalizeText(s).replace(/,/g, "."));
  return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
}

export const isSearchActive = (f: SearchFilter) => f.q.trim() !== "" || f.min !== null || f.max !== null;

export function matchesSearch(e: Searchable, f: SearchFilter) {
  if (f.min !== null && e.amount < f.min) return false;
  if (f.max !== null && e.amount > f.max) return false;
  const q = normalizeText(f.q);
  if (!q) return true;
  if (e.note && normalizeText(e.note).includes(q)) return true;
  if (e.merchant && normalizeText(e.merchant).includes(q)) return true;
  if (e.paymentLabel && normalizeText(e.paymentLabel).includes(q)) return true;
  // Amount, exact or partial: "25" finds 25, 250 and 12.25
  if (/^[0-9.,]+$/.test(q)) {
    const typed = q.replace(/,/g, ".");
    if (String(e.amount).includes(typed) || e.amount.toFixed(2).includes(typed)) return true;
  }
  return false;
}
