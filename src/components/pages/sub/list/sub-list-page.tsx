import dayjs from "dayjs";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bento, BentoHeader } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { SubListItem } from "~/components/pages/sub/list/sub-list-item";
import { SubsTotalSpend } from "~/components/pages/sub/list/subs-total-spend";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { List, Separator } from "~/components/ui/list";
import { toMapGrouped } from "~/utils/map";

export const SubListPage = () => {
  const { t } = useTranslation();
  return (
    <WebAppMain className="flex flex-col gap-6">
      <SubsTotalSpend />
      <div className="flex w-full justify-center px-2">
        <Separator />
      </div>
      <div className="w-full">
        <div className="w-full px-4 text-2xl font-bold">{t("all_subs")}</div>
        <SubsListGrouped />
      </div>
    </WebAppMain>
  );
};

const SubsListGrouped = () => {
  const { t } = useTranslation();
  const { subscriptions } = useProfile();
  const grouped = useMemo(() => {
    const byMonth = toMapGrouped(subscriptions, (sub) => {
      if (!sub.renewalDate) return "none";
      return dayjs(sub.renewalDate, { utc: true }).format("YYYY-MM");
    });
    // sort arrays by rewnewal date
    byMonth.forEach((subs) => {
      subs.sort((a, b) => {
        if (!a.renewalDate || !b.renewalDate) return 0;
        if (a.renewalDate === b.renewalDate) return 0;
        if (a.renewalDate < b.renewalDate) return -1;
        return 1;
      });
    });

    // sort by month
    const sorted = [...byMonth.entries()].sort(([a], [b]) => {
      return a < b ? -1 : 1;
    });

    return sorted.map(([month, subs]) => ({
      month,
      subs,
    }));
  }, [subscriptions]);

  return (
    <div className="flex w-full flex-col gap-3">
      {grouped.map((v) => (
        <Bento key={v.month} className="py-2">
          <BentoHeader className="capitalize">
            {v.month === "none"
              ? t("ended")
              : dayjs(v.month).format("MMMM YYYY")}
          </BentoHeader>
          <List>
            {v.subs.map((sub) => (
              <SubListItem key={sub.id} sub={sub} dateAbsolute withCycle />
            ))}
          </List>
        </Bento>
      ))}
    </div>
  );
};
