import RATES from "public/rates.json";
import { getCurrencyPrecision } from "~/lib/amount/currencies";

type RateKey = keyof typeof RATES;

export function convertAmount(
  amount: number,
  from: string,
  to: string,
): number {
  if (amount === 0) return 0;

  const fromPrecision = getCurrencyPrecision(from);
  const toPrecision = getCurrencyPrecision(to);

  const v = amount * 10 ** (toPrecision - fromPrecision);

  if (from === to) return v;
  if (from === "XXX") return 0;
  if (to === "XXX") return 0;

  const usd = v / RATES[from as RateKey];
  return usd * RATES[to as RateKey];
}
