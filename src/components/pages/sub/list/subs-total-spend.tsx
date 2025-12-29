import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
import { SpendBarChart } from "~/components/pages/sub/list/spend-bar-chart";
import { SubsList } from "~/components/pages/sub/list/sub-list";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { convertAmount } from "~/lib/amount/conversion";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import { calcSubsTotalSpend } from "~/lib/amount/spend";
import type { DateRange } from "~/lib/dates/dates";
import i18n from "~/lib/i18n";

dayjs.extend(isoWeek);

type Interval = "week" | "month" | "year";
function intervalToGap(interval: Interval) {
  switch (interval) {
    case "week":
      return "day" as const;
    case "month":
      return "week" as const;
    case "year":
      return "month" as const;
  }
}
function intervalToLabel(interval: Interval, selected: SubsTotal | null) {
  switch (interval) {
    case "week":
      if (selected) {
        return dayjs(selected.start).format("dddd");
      }
      return i18n.t("this_week");
    case "month":
      if (selected) {
        const start = dayjs(selected.start).format("D MMM");
        const end = dayjs(selected.end).subtract(1, "day").format("D MMM");
        return `${start} - ${end}`;
      }
      return i18n.t("this_month");
    case "year":
      if (selected) {
        return dayjs(selected.start).format("MMMM");
      }
      return i18n.t("this_year");
  }
}
function intervalToStartOf(interval: Interval) {
  switch (interval) {
    case "week":
      return "isoWeek" as const;
    case "month":
      return "month" as const;
    case "year":
      return "year" as const;
  }
}

interface SubsTotal {
  id: string;
  start: Date;
  end: Date;
  total: number;
  ids: string[];
}

export const SubsTotalSpend = () => {
  const { t } = useTranslation();
  const { subscriptions } = useProfile();
  const { interval, setInterval, currency, spend } = useTotalSpend();
  const [selected, setSelected] = useState<SubsTotal | null>(null);

  const filtered = useMemo(() => {
    if (!selected) {
      const ids = new Set(spend.flatMap((s) => s.ids));
      return subscriptions.filter((sub) => ids.has(sub.id));
    }
    return subscriptions.filter((sub) => selected.ids.includes(sub.id));
  }, [selected, spend, subscriptions]);
  const total = useMemo(() => {
    let t = 0;
    if (selected) {
      t = selected.total;
    } else {
      t = spend.reduce((acc, s) => acc + s.total, 0);
    }
    return formatAmountCurrency(t, currency);
  }, [spend, currency, selected]);

  return (
    <div className="flex w-full flex-col gap-4">
      <Bento>
        <div className="w-full px-2">
          <div className="flex items-center gap-2 text-base text-hint">
            <div className="font-semibold">{t("total")}</div>
            <div className="h-1 w-1 rounded-full bg-hint" />
            <div className="">{intervalToLabel(interval, selected)}</div>
          </div>
          <div className="text-4xl font-bold">{total}</div>
        </div>
      </Bento>

      <SpendBarChart
        data={spend}
        selected={selected}
        onClick={(total) => setSelected(total)}
        formatX={(d) => {
          if (interval === "week") return dayjs(d).format("ddd");
          if (interval === "month") {
            const start = dayjs(d);
            const end = start.add(1, "week").subtract(1, "day");
            if (start.isSame(end, "month")) {
              return `${start.format("D")}-${end.format("D")}`;
            }
            return `${start.format("D")}-${start.endOf("month").format("D")}`;
          }
          return dayjs(d).format("MMM");
        }}
        formatY={(v) => formatAmountCurrency(v, currency, { rounding: 0 })}
      />

      <Bento>
        <Tabs
          defaultValue="week"
          className="w-full"
          value={interval}
          onValueChange={(v) => {
            setSelected(null);
            setInterval(v as Interval);
          }}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">{t("week")}</TabsTrigger>
            <TabsTrigger value="month">{t("month")}</TabsTrigger>
            <TabsTrigger value="year">{t("year")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </Bento>

      <Bento>
        <SubsList subs={filtered} withCycle dateAbsolute />
      </Bento>
    </div>
  );
};

function useTotalSpend() {
  const [interval, setInterval] = useState<Interval>("week");
  const [startDate, setStartDate] = useState(dayjs());
  const { subs, currency } = useMySubs();
  const spend = useMemo(() => {
    const dates = getDateRanges(startDate, interval);
    return dates.map((d) => {
      const { total, renewingIds } = calcSubsTotalSpend(subs, d);
      return {
        id: Math.random().toString(),
        start: dayjs(d.start).toDate(),
        end: dayjs(d.end).toDate(),
        total,
        ids: renewingIds,
      };
    });
  }, [interval, startDate, subs]);

  return { interval, setInterval, startDate, setStartDate, spend, currency };
}

function useMySubs() {
  const { subscriptions, user } = useProfile();
  const currency = useCurrency();
  const subs = useMemo(() => {
    return subscriptions
      .map((sub) => {
        const contrib = sub.contribs.filter((c) => c.userId === user.id);
        return contrib.map((c) => ({
          id: sub.id,
          startDate: sub.startDate,
          endDate: sub.endDate,
          amount: convertAmount(c.amountOwed, sub.currencyCode, currency),
          cycle: { unit: sub.cycleUnit, value: sub.cycleValue },
        }));
      })
      .flat();
  }, [subscriptions, user.id, currency]);
  return { subs, currency };
}

function useCurrency() {
  const { subscriptions, user, isLoading } = useProfile();
  if (isLoading) return "USD";
  if (user.currencyCode) return user.currencyCode;
  const sub = subscriptions[0];
  if (sub) return sub.currencyCode;
  return "USD";
}

function getDateRanges(start: dayjs.Dayjs, interval: Interval) {
  const startOfDay = start.startOf(intervalToStartOf(interval)).startOf("day");
  return splitDateRange(
    { start: startOfDay, end: startOfDay.add(1, interval) },
    intervalToGap(interval)
  );
}

function splitDateRange(
  dateRange: DateRange,
  splitBy: "day" | "week" | "month"
) {
  const start = dayjs(dateRange.start);
  const end = dayjs(dateRange.end);
  const dates = [];
  for (let date = start; date < end; date = date.add(1, splitBy)) {
    dates.push({ start: date, end: date.add(1, splitBy) });
  }
  return dates;
}
