/**
 * The supported date range, shared by the UI and the server so they always agree.
 * Expenses can be entered for any day from 1 Jan MIN_YEAR to 31 Dec MAX_YEAR (the database enforces the same).
 */
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;
export const EARLIEST_DATE_ISO = `${MIN_YEAR}-01-01`;
