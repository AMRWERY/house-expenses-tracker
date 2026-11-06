import type { DateTimeFormat, NumberFormat } from "@intlify/core-base";

export interface I18nTypes {
  t: (key: string, params?: Record<string, any>) => string;
  setLocale: (locale: string) => void;
}

export type SupportedLocales = "en" | "ar";

export type DatetimeFormats = {
  [key in SupportedLocales]: DateTimeFormat;
};

export type NumberFormats = {
  [key in SupportedLocales]: NumberFormat;
};
