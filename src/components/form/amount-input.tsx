import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrencyAmountParser } from "~/components/form/amount-utils";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { ButtonV1 } from "~/components/ui/buttonv1";
import { ListItem, ListItemBody } from "~/components/ui/list-item";
import { useCurrencies, type Currency } from "~/lib/amount/currencies";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import { cn } from "~/lib/utils";

interface FormAmountInputProps {
  amount: number;
  currency: Currency;
  label: string;
  setAmount: (amount: number) => void;
  onEditCurrency: () => void;
}

export const FormAmountInput = ({
  amount,
  currency,
  label,
  setAmount,
  onEditCurrency,
}: FormAmountInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const { decimals, parser } = useCurrencyAmountParser(currency);
  const [value, setValue] = useState(() => {
    if (amount === 0) return "";
    return (amount / 10 ** decimals).toFixed(decimals);
  });
  const onAmountChange = (v: string) => {
    const int = parser(v);
    if (int === null) return;
    setAmount(int);
    setValue(v);
  };

  const isInputShown = isFocused || value;

  return (
    <ListItem>
      <ListItemBody className="justify-between gap-2">
        <div className="w-full">
          <label
            htmlFor="amount"
            className={cn(
              "block w-full text-sm text-hint transition-transform duration-300",
              !isInputShown && "translate-y-[13px] text-base",
            )}
          >
            {label}
          </label>
          <AmountInput
            id="amount"
            className={cn(!isInputShown && "text-transparent")}
            currency={currency}
            value={value}
            onValueChange={onAmountChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
        <ButtonV1
          variant="tertiary"
          size="picker"
          className="w-fit"
          onClick={onEditCurrency}
        >
          {currency.code}
        </ButtonV1>
      </ListItemBody>
    </ListItem>
  );
};

interface AmountInputProps {
  id?: string;
  className?: string;
  currency: Currency;
  value: string;
  onValueChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const AmountInput = ({
  id,
  className,
  currency,
  value,
  onValueChange,
  onFocus,
  onBlur,
}: AmountInputProps) => {
  return (
    <div className={cn("inline-flex w-full items-center text-base", className)}>
      <div>{currency.symbol}</div>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        className="w-full placeholder-transparent focus:placeholder-hint"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={formatAmountCurrency(0, currency, {
          withSymbol: false,
          withSign: false,
        })}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
};

function useCurrencyCounts() {
  const { transactions } = useProfile();
  return React.useMemo(() => {
    const codeToCount = transactions
      .map((t) => t.currencyCode)
      .reduce(
        (acc, cur) => {
          acc[cur] = (acc[cur] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
    return Object.entries(codeToCount)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);
  }, [transactions]);
}

export function useCurrencyOptions() {
  const { t } = useTranslation();
  const currencies = useCurrencies();
  const currencyCounts = useCurrencyCounts();

  // Group currencies into "recent" and "all"
  // Order "recent" by number of occurrences in transactions
  const options = React.useMemo(() => {
    if (currencyCounts.length === 0) {
      return [
        {
          label: t("all"),
          options: Object.values(currencies),
        },
      ];
    }

    const recent = currencyCounts
      .map((c) => currencies[c.code])
      .filter((c) => c !== undefined);
    const all = Object.entries(currencies)
      .filter(([code]) => !recent.some((c) => c.code === code))
      .map(([, c]) => c);

    return [
      {
        label: t("recent"),
        options: recent,
      },
      {
        label: t("all"),
        options: all,
      },
    ];
  }, [currencyCounts, currencies, t]);

  return options;
}
