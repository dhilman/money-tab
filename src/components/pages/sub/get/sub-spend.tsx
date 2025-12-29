import { CalendarCheckIcon, CalendarFoldIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CurrencyAmount } from "~/components/amount";
import { Bento } from "~/components/bento-box";
import {
  NativeSelect,
  NativeSelectChevron,
} from "~/components/form/native-select";
import { useSubCtx } from "~/components/pages/sub/get/sub-provider";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemIcon,
  ListItemLeft,
  ListItemLoading,
} from "~/components/ui/list-item";
import { type Cycle } from "~/lib/consts/types";
import { type AnyDate } from "~/lib/dates/dates";
import { formatDate } from "~/lib/dates/format-dates";
import { calcRenewalsPassed } from "~/lib/dates/subscription";

export const SubDetails = () => {
  return (
    <div className="flex w-full flex-col gap-5">
      <SubDates />
      <SubSpendBreakdown />
    </div>
  );
};

const SubDates = () => {
  const { t } = useTranslation();
  const { sub, isLoading } = useSubCtx();

  if (isLoading) {
    return (
      <Bento>
        <List>
          <ListItemLoading />
        </List>
      </Bento>
    );
  }

  return (
    <Bento>
      <List>
        <ListItem>
          <ListItemLeft size="sm">
            <ListItemIcon
              icon={CalendarFoldIcon}
              className="bg-green-500"
              iconClassName="text-white h-4 w-4"
            />
          </ListItemLeft>
          <ListItemBody className="justify-between" size="sm">
            <div>{t("start_date")}</div>
            <div className="text-hint">
              {formatDate(sub.startDate, { utc: false })}
            </div>
          </ListItemBody>
        </ListItem>
        {sub.endDate && (
          <ListItem>
            <ListItemLeft size="sm">
              <ListItemIcon
                icon={CalendarCheckIcon}
                className="bg-gray-500"
                iconClassName="text-white h-4 w-4"
              />
            </ListItemLeft>
            <ListItemBody size="sm" className="justify-between">
              <div>{t("end_date")}</div>
              <div className="text-hint">
                {formatDate(sub.endDate, { utc: false })}
              </div>
            </ListItemBody>
          </ListItem>
        )}
      </List>
    </Bento>
  );
};

type SpendType = "total" | "personal";

const SubSpendBreakdown = () => {
  const { t } = useTranslation();
  const { sub } = useSubCtx();
  const [filter, setFilter] = useState<SpendType>("personal");

  return (
    <Bento className="gap-3">
      <div className="flex w-full items-center px-2">
        <div className="font-semibold capitalize">{t("spend_breakdown")}</div>
        {sub.contribs.length > 1 && (
          <NativeSelect
            className="ml-auto h-6 py-0 text-center text-xs capitalize text-primary"
            value={filter}
            onChange={(v) => setFilter(v)}
            options={[
              { label: t("total"), value: "total" },
              { label: t("my_share"), value: "personal" },
            ]}
            icon={<NativeSelectChevron className="h-3.5 w-3.5" />}
          />
        )}
      </div>
      <SubSpendLists type={filter} />
    </Bento>
  );
};

interface SubSpendLists {
  type: SpendType;
}

function SubSpendLists({ type }: SubSpendLists) {
  const { t } = useTranslation();
  const { user } = useProfile();
  const { sub, isLoading } = useSubCtx();

  const amount = useMemo(() => {
    if (type === "total") return sub.amount;
    const contrib = sub.contribs.find((c) => c.userId === user.id);
    if (!contrib) return 0;
    return contrib.amountOwed;
  }, [type, sub.amount, sub.contribs, user.id]);

  const spend = useMemo(() => {
    const byInterval = calcIntervalSpend(amount, {
      unit: sub.cycleUnit,
      value: sub.cycleValue,
    });
    const total = calcSpendSinceStart(amount, sub);
    return { ...byInterval, total };
  }, [amount, sub]);

  function Amount({ amount }: { amount: number }) {
    return (
      <CurrencyAmount
        amount={amount}
        currency={sub.currencyCode}
        className="ml-auto"
      />
    );
  }

  if (isLoading) {
    return (
      <>
        <List>
          <ListItemLoading />
        </List>
        <List>
          <ListItemLoading />
          <ListItemLoading />
          <ListItemLoading />
        </List>
      </>
    );
  }

  return (
    <>
      <List>
        <ListItem>
          <ListItemBody size="sm">
            {t("spend_to_date")}
            <Amount amount={spend.total} />
          </ListItemBody>
        </ListItem>
      </List>
      <List>
        <ListItem>
          <ListItemBody size="sm">
            {t("weekly")}
            <Amount amount={spend.weekly} />
          </ListItemBody>
        </ListItem>
        <ListItem>
          <ListItemBody size="sm">
            {t("monthly")}
            <Amount amount={spend.monthly} />
          </ListItemBody>
        </ListItem>
        <ListItem>
          <ListItemBody size="sm">
            {t("yearly")}
            <Amount amount={spend.yearly} />
          </ListItemBody>
        </ListItem>
      </List>
    </>
  );
}

function calcSpendSinceStart(
  amount: number,
  params: {
    startDate: AnyDate;
    endDate: AnyDate | null;
    cycle: Cycle;
  }
) {
  const cycles = calcRenewalsPassed(params);
  return cycles * amount;
}

function calcIntervalSpend(amount: number, cycle: Cycle) {
  const { unit, value } = cycle;
  switch (unit) {
    case "DAY":
      return {
        weekly: (amount / value) * 7,
        monthly: (amount / value) * 30,
        yearly: (amount / value) * 365,
      };
    case "WEEK":
      return {
        weekly: amount,
        monthly: (amount / value) * 4.345,
        yearly: (amount / value) * 52,
      };
    case "MONTH":
      return {
        weekly: amount / value / 4.345,
        monthly: amount / value,
        yearly: (amount / value) * 12,
      };
    case "YEAR":
      return {
        weekly: amount / value / 52,
        monthly: amount / value / 12,
        yearly: amount,
      };
  }
}
