import dayjs from "dayjs";
import { AsteriskIcon, ChevronsUpDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CurrencyAmount } from "~/components/amount";
import { Bento, BentoContent } from "~/components/bento-box";
import {
  NativeSelectTrigger,
  useTranslatedOptions,
  type SelectOption,
} from "~/components/form/native-select";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { combineUserBalances } from "~/lib/amount/balance";
import {
  calcSubsSpend,
  calcSubsUserBalances,
} from "~/lib/amount/calc-sub-balance";
import { convertAmount } from "~/lib/amount/conversion";
import { api } from "~/utils/api";

const SPEND_OPTIONS = [
  // t("balance")
  { value: "balance", label: "balance" },
  // t("subscriptions")
  { value: "subscriptions", label: "subscriptions" },
] as const;
type SpendType = (typeof SPEND_OPTIONS)[number]["value"];

const TIME_PERIOD_OPTIONS = [
  // t("all_time")
  { value: "all", label: "all_time" },
  // t("this_week")
  { value: "week", label: "this_week" },
  // t("this_month")
  { value: "month", label: "this_month" },
  // t("this_year")
  { value: "year", label: "this_year" },
] as const;
type TimePeriodType = (typeof TIME_PERIOD_OPTIONS)[number]["value"];

export const HomeBalance = () => {
  const [spendType, setSpendType] = useState<SpendType>("balance");
  const [timePeriod, setTimePeriod] = useState<TimePeriodType>("all");
  const { balance, currencyCode, isLoading } = useBalance({
    spendType,
    timePeriod,
  });

  return (
    <Bento>
      <BentoContent className="flex flex-col items-center gap-5 rounded-[20px] p-4 pt-6">
        <BalanceAmount
          amount={balance}
          currencyCode={currencyCode}
          isLoading={isLoading}
          spendType={spendType}
        />
        <div className="grid w-full grid-cols-2 gap-4">
          <SpendTypeSelect value={spendType} onChange={setSpendType} />
          <PeriodSelect value={timePeriod} onChange={setTimePeriod} />
        </div>
      </BentoContent>
    </Bento>
  );
};

interface BalanceAmountProps {
  amount: number;
  currencyCode: string;
  isLoading: boolean;
  spendType: SpendType;
}

const BalanceAmount = ({
  amount,
  currencyCode,
  isLoading,
  spendType,
}: BalanceAmountProps) => {
  const { user } = useProfile();

  if (user.hideBalance) {
    return (
      <div className="flex h-[72px] items-center justify-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <AsteriskIcon key={i} className="h-6 w-6 text-hint" strokeWidth={3} />
        ))}
      </div>
    );
  }

  return (
    <CurrencyAmount
      size="5xl"
      className="w-full text-center text-[60px] leading-[72px] font-bold"
      isLoading={isLoading}
      amount={amount}
      currency={currencyCode}
      color={spendType === "balance" ? "amount" : "none"}
    />
  );
};

interface SpendTypeSelectProps {
  value: SpendType;
  onChange: (value: SpendType) => void;
}

const SpendTypeSelect = ({ value, onChange }: SpendTypeSelectProps) => {
  const { t } = useTranslation();
  const options = useTranslatedOptions(SPEND_OPTIONS);

  return (
    <Select
      label={t("spend_type")}
      options={options}
      value={value}
      onChange={onChange}
    />
  );
};

interface PeriodSelectProps {
  value: TimePeriodType;
  onChange: (value: TimePeriodType) => void;
}

const PeriodSelect = ({ value, onChange }: PeriodSelectProps) => {
  const { t } = useTranslation();
  const options = useTranslatedOptions(TIME_PERIOD_OPTIONS);
  return (
    <Select
      label={t("period")}
      options={options}
      value={value}
      onChange={onChange}
    />
  );
};

interface SelectProps<T extends string> {
  label: string;
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const Select = <T extends string>({
  label,
  options,
  value,
  onChange,
}: SelectProps<T>) => {
  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative grid w-full rounded-xl bg-tertiary">
      <NativeSelectTrigger
        options={options}
        value={value}
        onChange={onChange}
        className="rounded-xl"
      />
      <label className="col-start-1 row-start-1 pt-[9px] pb-[8px] pl-3">
        <div className="text-sm text-hint">{label}</div>
        <div className="text-base font-medium">{selected?.label}</div>
      </label>
      <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
        <ChevronsUpDownIcon className="h-4 w-4" />
      </div>
    </div>
  );
};

interface UseBalanceParams {
  spendType: SpendType;
  timePeriod: TimePeriodType;
}

function useBalance({ spendType, timePeriod }: UseBalanceParams) {
  const [toDate] = useState(dayjs().add(1, "day").startOf("day"));
  const fromDate = useMemo(() => timePeriodToDate(timePeriod), [timePeriod]);
  const { data: txBalances, isLoading: isLoading1 } = api.user.balance.useQuery(
    {
      fromDate,
    },
    {
      staleTime: Infinity,
    },
  );
  const {
    user: me,
    subscriptions,
    currencyCode,
    isLoading: isLoading2,
  } = useProfile();
  const isLoading = isLoading1 || isLoading2;

  const balance = useMemo(() => {
    const params = { userId: me.id, fromDate, toDate };

    if (spendType === "subscriptions") {
      const totals = calcSubsSpend(subscriptions, params);
      return totals.reduce((acc, cur) => {
        const amount = convertAmount(
          cur.amount,
          cur.currencyCode,
          currencyCode,
        );
        return acc + amount;
      }, 0);
    }

    // loading
    if (txBalances === undefined) return 0;

    const subBalances = calcSubsUserBalances(subscriptions, params);
    const balances = combineUserBalances([txBalances, subBalances]);

    return balances.reduce((acc, cur) => {
      const amount = convertAmount(cur.amount, cur.currencyCode, currencyCode);
      return acc + amount;
    }, 0);
  }, [
    txBalances,
    subscriptions,
    me.id,
    fromDate,
    toDate,
    spendType,
    currencyCode,
  ]);

  return { balance, currencyCode, isLoading };
}

/**
 * Returns either null or start of the time period, converted to UTC and then only the date part as string
 */
function timePeriodToDate(timePeriod: TimePeriodType) {
  switch (timePeriod) {
    case "all":
      return null;
    case "week":
      return dayjs().startOf("week").toISOString().slice(0, 10);
    case "month":
      return dayjs().startOf("month").toISOString().slice(0, 10);
    case "year":
      return dayjs().startOf("year").toISOString().slice(0, 10);
  }
}
