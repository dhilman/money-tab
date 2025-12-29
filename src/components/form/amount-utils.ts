import { useMemo } from "react";
import { getCurrencyPrecision, type Currency } from "~/lib/amount/currencies";

export function useCurrencyAmountParser(currency: Currency) {
  const { decimals, regex } = useMemo(() => {
    const decimals = getCurrencyPrecision(currency);
    const regex = new RegExp(`^\\d*[\\.\\,]?\\d{0,${decimals}}$`);
    return { decimals, regex };
  }, [currency]);

  function parser(s: string) {
    if (!s) return 0;

    if (!regex.test(s)) return null;

    const number = Number(s.replace(",", "."));
    if (isNaN(number)) return null;

    const int = Math.round(number * 10 ** decimals);
    return int;
  }

  return { decimals, parser };
}
