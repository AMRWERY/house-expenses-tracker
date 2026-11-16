/**
 * CSV helpers. Text cells that start with = + - @ (or a tab/CR) would be run as formulas by Excel/Sheets, so they
 * get a leading apostrophe. Quotes, commas and line breaks are escaped. The file starts with a BOM so Excel reads Arabic.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export const csvCell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Real numbers (even negative ones) are data, not formulas; only text gets the guard.
  if (typeof value === "string" && FORMULA_START.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows: (string | number | null | undefined)[][]): string => {
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
};
