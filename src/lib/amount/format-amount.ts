import {
  getCurrencyPrecision,
  getCurrencySymbol,
  type Currency,
} from "~/lib/amount/currencies";

export function formatAmountDecimal(
  amount: number,
  currency: string | Currency,
  params: { rounding?: number } = {},
) {
  const { rounding = 0 } = params;
  const symbol = getCurrencySymbol(currency);
  const formatted = formatAmountForLocale(amount, rounding);
  return `${symbol}${formatted}`;
}

export function formatAmountCurrency(
  amount: number,
  currency: string | Currency,
  params: {
    withSymbol?: boolean;
    withSign?: boolean;
    rounding?: number;
  } = {},
) {
  const precision = getCurrencyPrecision(currency);
  const { withSymbol = true, withSign = false, rounding = precision } = params;

  const formatted = formatAmountForLocale(
    Math.abs(amount / 10 ** precision),
    rounding,
  );

  let prefix = "";
  if (withSign && amount < 0) {
    prefix = "-";
  }
  if (withSymbol) {
    prefix += getCurrencySymbol(currency);
  }

  return prefix + formatted;
}

export function formatAmountForLocale(amount: number, precision: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

export function formatEnum(value: string) {
  return (
    value
      .split("_")
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      .map((v) => v[0] + v.slice(1).toLowerCase())
      .join(" ")
  );
}
