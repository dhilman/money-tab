import Fuse from "fuse.js";
import { SearchIcon } from "lucide-react";
import CURRENCY_FLAGS from "public/currency_flags.json";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebounce } from "use-debounce";
import { TextInput } from "~/components/form/text-input";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import type { Currency } from "~/lib/amount/currencies";
import { cn } from "~/lib/utils";

interface OptionGroup {
  label: string;
  options: Currency[];
}

interface Props {
  options: OptionGroup[];
  onSelect: (currency: Currency) => void;
}

export const CurrencySelect = ({ options, onSelect }: Props) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 150);

  const fuse = useMemo(() => {
    return new Fuse(
      options.flatMap((group) => group.options),
      {
        keys: ["name", "code"],
        isCaseSensitive: false,
        shouldSort: true,
        threshold: 0.4,
      }
    );
  }, [options]);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return options;
    const results = fuse.search(debouncedQuery).map((r) => r.item);
    return [
      {
        label: "Search Results",
        options: results,
      },
    ];
  }, [debouncedQuery, fuse, options]);

  return (
    <div className="w-full max-w-xl space-y-6">
      <div className="px-2">
        <div className="flex h-9 w-full items-center gap-1 rounded-lg bg-hint/10 px-3 text-hint">
          <SearchIcon className="h-5 w-5" />
          <TextInput
            className="h-7 w-full bg-transparent pl-1 pr-2 text-sm text-foreground"
            placeholder={t("search_currencies")}
            value={query}
            onChange={(v) => setQuery(v)}
          />
        </div>
      </div>
      <div className="flex w-full flex-col items-center gap-5">
        {filtered.map((group) => (
          <div key={group.label} className="w-full space-y-2">
            <div className="w-full px-3 text-sm font-medium text-hint">
              {group.label}
            </div>
            <List>
              {group.options.map((currency) => (
                <CurrencyOption
                  key={currency.code}
                  currency={currency}
                  onClick={() => onSelect(currency)}
                />
              ))}
            </List>
          </div>
        ))}
      </div>
    </div>
  );
};

interface CurrencyOption {
  currency: Currency;
  onClick: () => void;
}

export const CurrencyOption = ({ currency, onClick }: CurrencyOption) => {
  const valIsName = currency.code === currency.name;

  return (
    <ListItem as="button" onClick={onClick}>
      <ListItemLeft>
        <CurrencyListIcon code={currency.code} />
      </ListItemLeft>
      <ListItemBody className="gap-4">
        <div className="truncate text-left font-medium">
          {currency.name}
          {valIsName ? "" : ` (${currency.code})`}
        </div>
        <div className="ml-auto shrink-0 text-sm text-hint">
          {currency.symbol}
        </div>
      </ListItemBody>
    </ListItem>
  );
};

interface CurrencyListIconProps {
  className?: string;
  code: string;
}

export const CurrencyListIcon = ({
  className,
  code,
}: CurrencyListIconProps) => {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-hint/10 text-lg",
        className
      )}
    >
      <CurrencyFlag code={code} />
    </div>
  );
};

interface CurrencyFlagProps {
  code: string;
}

const CurrencyFlag = ({ code }: CurrencyFlagProps) => {
  const flag = CURRENCY_FLAGS[code as keyof typeof CURRENCY_FLAGS];

  if (!flag) return <>🏳️</>;

  if (flag.length === 2) {
    return <div className="text-sm">{flag}</div>;
  }

  return <>{flag}</>;
};
