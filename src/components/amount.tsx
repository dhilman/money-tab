import { LoadingText } from "~/components/provider/states-provider";
import { getCurrencyWithDefault, type Currency } from "~/lib/amount/currencies";
import { formatAmountForLocale } from "~/lib/amount/format-amount";
import { cn } from "~/lib/utils";

type Sizes = "sm" | "base" | "lg" | "3xl" | "4xl" | "5xl";

interface CurrencyAmountProps {
  as?: "div" | "span";
  className?: string;
  size?: Sizes;
  amount: number;
  currency: string | Currency;
  color?: "none" | "amount" | "symbol";
  isLoading?: boolean;
}

export const CurrencyAmount = ({
  as = "div",
  size = "base",
  className,
  amount,
  currency,
  color = "symbol",
  isLoading,
}: CurrencyAmountProps) => {
  const El = as;
  const curr = getCurrencyWithDefault(currency);
  const fomatted = formatAmountForLocale(
    Math.abs(amount / 10 ** curr.precision),
    curr.precision,
  );

  function getAmountColor() {
    if (color !== "amount") return "";
    if (amount > 0) return "text-green-500";
    if (amount < 0) return "text-red-500";
    return "text-hint";
  }

  return (
    <El className={cn(getAmountColor(), className)}>
      <span
        className={cn(
          color === "symbol" && "text-hint",
          getSymbolClassNames(size, fomatted.length),
        )}
      >
        {!isLoading && curr.symbol}
      </span>
      <span className={cn(getAmountClassNames(size, fomatted.length))}>
        {isLoading ? <LoadingText text="20.00" /> : fomatted}
      </span>
    </El>
  );
};

function getAmountClassNames(size: Sizes, len: number): string {
  switch (size) {
    case "sm":
      return "text-sm";
    case "base":
      return "text-base";
    case "lg":
      return "text-lg";
    case "3xl":
      return "text-3xl";
    case "4xl":
      if (len > 8) return "text-[38px] font-rounded";
      return "text-[44px] font-rounded";
    case "5xl":
      if (len > 8) return "text-4xl tracking-[0.44px] font-rounded";
      if (len > 6) return "text-5xl tracking-[0.44px] font-rounded";
      return "text-6xl tracking-[0.44px] font-rounded";
  }
}

function getSymbolClassNames(size: Sizes, len: number): string {
  switch (size) {
    case "sm":
      return "text-xxs";
    case "base":
      return "text-xs";
    case "lg":
      return "text-sm";
    case "3xl":
      return "text-lg";
    case "4xl":
      if (len > 8) return "text-[28px]";
      return "text-[34px]";
    case "5xl":
      if (len > 8) return "text-2xl";
      return "text-4xl";
  }
}
