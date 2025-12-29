import dayjs from "dayjs";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CurrencyAmount } from "~/components/amount";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { Separator } from "~/components/ui/list";
import type { CycleUnit } from "~/lib/consts/types";
import { calcRenewalsInRange } from "~/lib/dates/subscription";
import type { RouterOutputs } from "~/utils/api";

export const SubsTotalRemining = () => {
  const { t } = useTranslation();
  const { user, subscriptions } = useProfile();

  const totals = useMemo(() => {
    return calcTotalRemaining({ subs: subscriptions, userId: user.id });
  }, [subscriptions, user.id]);

  const TotalEntry = ({
    label,
    amounts,
  }: {
    label: string;
    amounts: AmountCurrency[];
  }) => {
    return (
      <div className="flex h-12 w-full items-center justify-between px-3">
        <div className="text-hint">{label}</div>
        <div className="text-right font-medium">
          {amounts.length === 0 && "--"}
          {amounts.map((a, i) => (
            <span key={i}>
              <CurrencyAmount
                as="span"
                amount={a.amount}
                currency={a.currency}
              />
              {i < amounts.length - 1 && ", "}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Bento>
      <BentoHeader>Remaining</BentoHeader>
      <BentoContent>
        <TotalEntry label={t("this_week")} amounts={totals.thisWeek} />
        <Separator />
        <TotalEntry label={t("this_month")} amounts={totals.thisMonth} />
        <Separator />
        <TotalEntry label={t("this_year")} amounts={totals.thisYear} />
      </BentoContent>
    </Bento>
  );
};

interface AmountCurrency {
  amount: number;
  currency: string;
}

interface CalcTotalRemainingOutput {
  thisWeek: AmountCurrency[];
  thisMonth: AmountCurrency[];
  thisYear: AmountCurrency[];
}

type Sub = RouterOutputs["user"]["start"]["subscriptions"][0];

const calcTotalRemaining = (params: {
  subs: Sub[];
  userId: string;
}): CalcTotalRemainingOutput => {
  const { subs, userId } = params;
  const contribs = subs
    .map((sub) => {
      const contribs = sub.contribs.filter((c) => c.userId === userId);
      return contribs.map((c) => ({
        amount: c.amountOwed,
        startDate: sub.startDate,
        endDate: sub.endDate,
        cycleUnit: sub.cycleUnit,
        cycleValue: sub.cycleValue,
        currencyCode: sub.currencyCode,
      }));
    })
    .flat();

  const today = dayjs().startOf("day");
  const thisWeek = calcRemaining({
    subs: contribs,
    fromDate: today,
    toDate: today.startOf("week").add(1, "week"),
  });
  const thisMonth = calcRemaining({
    subs: contribs,
    fromDate: today,
    toDate: today.startOf("month").add(1, "month"),
  });
  const thisYear = calcRemaining({
    subs: contribs,
    fromDate: today,
    toDate: today.startOf("year").add(1, "year"),
  });
  return {
    thisWeek,
    thisMonth,
    thisYear,
  };
};

const calcRemaining = (params: {
  subs: {
    amount: number;
    currencyCode: string;
    startDate: string;
    endDate: string | null;
    cycleUnit: CycleUnit;
    cycleValue: number;
  }[];
  fromDate: dayjs.Dayjs;
  toDate: dayjs.Dayjs;
}): AmountCurrency[] => {
  const { subs, fromDate, toDate } = params;
  return subs
    .map((sub) => {
      const renewals = calcRenewalsInRange(
        {
          startDate: sub.startDate,
          endDate: sub.endDate,
          cycle: { unit: sub.cycleUnit, value: sub.cycleValue },
        },
        { start: fromDate, end: toDate }
      );
      return {
        amount: sub.amount * renewals,
        currency: sub.currencyCode,
      };
    })
    .reduce((acc, sub) => {
      const existing = acc.find((a) => a.currency === sub.currency);
      if (existing) {
        existing.amount += sub.amount;
      } else {
        acc.push(sub);
      }
      return acc;
    }, [] as AmountCurrency[])
    .filter((a) => a.amount > 0);
};
