import CURRENCIES from "public/currencies.json";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  precision: number;
}

type Currencies = Record<string, Currency>;

export function useCurrencies() {
  return getCurrencies();
}

export function getCurrencies(): Currencies {
  return CURRENCIES;
}

export function getCurrencyByCode(code: string): Currency | undefined {
  return getCurrencies()[code];
}

export function getCurrencyByCodeWithDefault(code?: string | null) {
  const currs = getCurrencies();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!code) return currs["USD"]!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return currs[code] ?? currs["USD"]!;
}

export function getCurrencyWithDefault(currency?: string | Currency) {
  if (typeof currency === "object") {
    return currency;
  }
  return getCurrencyByCodeWithDefault(currency);
}

export function getCurrencyPrecision(currency: string | Currency) {
  if (typeof currency === "object") {
    return currency.precision;
  }
  const c = getCurrencyByCode(currency);
  if (!c) return 2;
  return c.precision;
}

export function getCurrencySymbol(currency: string | Currency) {
  if (typeof currency === "object") {
    return currency.symbol;
  }
  const c = getCurrencyByCode(currency);
  return c?.symbol ?? "";
}
