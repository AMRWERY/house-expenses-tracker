import type { DatetimeFormats, NumberFormats } from "../../types/i18n-types";

const datetimeFormats: DatetimeFormats = {
  en: {
    short: { year: "numeric", month: "short", day: "numeric" },
    long: {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
    },
  },
  ar: {
    short: { year: "numeric", month: "short", day: "numeric" },
    long: {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    },
  },
};

// This map is the single source of truth for all supported currencies.
// The key is the ISO 4217 currency code.
export const supportedCurrencies = {
  EGP: "Egyptian Pound", // Egypt
  SDG: "Sudanese Pound", // Sudan
  DJF: "Djiboutian franc", // Djibouti
  LYD: "Libyan Dinar", // Libya
  TND: "Tunisian Dinar", // Tunisia
  DZD: "Algerian Dinar", // Algeria
  MAD: "Moroccan Dirham", // Morocco
  MRU: "Mauritanian Ouguiya", // Mauritania
  KMF: "Comorian franc", // Comoros
  SOS: "Somali Shilling", // Somalia
  PSD: "Shekel", // Palestine
  SAR: "Saudi Riyal", // Saudi Arabia
  AED: "UAE Dirham", // UAE
  QAR: "Qatari Riyal", // Qatar
  KWD: "Kuwaiti Dinar", // Kuwait
  OMR: "Omani Rial", // Oman
  BHD: "Bahraini Dinar", // Bahrain
  JOD: "Jordanian Dinar", // Jordan
  LBP: "Lebanese Pound", // Lebanon
  SYP: "Syrian Pound", // Syria
  YER: "Yemeni Rial", // Yemen
  IQD: "Iraqi Dinar", // Iraq
};

// Dynamically create number format configurations for each currency.
// This is a scalable approach.
const arabicNumberFormats = Object.fromEntries(
  Object.keys(supportedCurrencies).map((currency) => [
    `currency_${currency}`,
    {
      style: "currency",
      currency,
      useGrouping: true,
      currencyDisplay: "symbol",
    },
  ]),
);

const englishNumberFormats = Object.fromEntries(
  Object.keys(supportedCurrencies).map((currency) => [
    `currency_${currency}`,
    {
      style: "currency",
      currency,
      notation: "standard",
    },
  ]),
);

// Assemble the final numberFormats object for the i18n configuration.
const numberFormats: NumberFormats = {
  en: {
    ...englishNumberFormats,
    decimal: {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    percent: {
      style: "percent",
      useGrouping: false,
    },
  },
  ar: {
    ...arabicNumberFormats,
    decimal: {
      style: "decimal",
      minimumSignificantDigits: 3,
      maximumSignificantDigits: 5,
    },
    percent: {
      style: "percent",
      useGrouping: false,
    },
  },
};

export default defineI18nConfig(() => {
  return {
    legacy: false,
    locale: "en",
    fallbackLocale: "en",
    // messages: { en, ar },
    datetimeFormats,
    numberFormats,
    missingWarn: false,
    fallbackWarn: false,
    warnHtmlMessage: false,
  };
});
