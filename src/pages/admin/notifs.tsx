import dayjs from "dayjs";
import { useMemo } from "react";
import {
  AdminDateRange,
  useDateRangeQuery,
} from "~/components/admin/admin-date-range";
import { BentoCounts } from "~/components/admin/bento-counts";
import { DayCountAreaChart } from "~/components/admin/day-count-area-chart";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { NavDefault } from "~/components/common/layout/nav";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { webAppPage } from "~/components/provider/webapp-provider";
import { api } from "~/utils/api";

export default webAppPage(Page);
function Page() {
  const { value: dateRange, onChange: setDateRange } = useDateRangeQuery();
  const { data } = api.admin.notifications.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const totalsByDay = useMemo(() => {
    if (!data) return [];
    const totals: { key: Date; count: number }[] = [];
    data.counts.forEach((c) => {
      const existing = totals.find((t) =>
        dayjs(t.key).isSame(dayjs(c.key), "day")
      );
      if (existing) {
        existing.count += c.count;
      } else {
        totals.push({ key: c.key, count: c.count });
      }
    });
    return totals;
  }, [data]);

  const totalsByName = useMemo(() => {
    if (!data) return [];
    const totals: { key: string; count: number }[] = [];
    data.counts.forEach((c) => {
      const existing = totals.find((t) => t.key === c.name);
      if (existing) {
        existing.count += c.count;
      } else {
        totals.push({ key: c.name ?? "", count: c.count });
      }
    });
    return totals;
  }, [data]);

  if (!data) return <div />;

  return (
    <>
      <NavDefault title="Notifications" />

      <WebAppMain className="flex w-full max-w-4xl flex-col gap-6 py-6">
        <div className="flex w-full items-center justify-between px-4">
          <div className="text-2xl font-semibold">Users</div>
          <AdminDateRange value={dateRange} onChange={setDateRange} />
        </div>

        <Bento>
          <BentoHeader>Total Notifications</BentoHeader>
          <BentoContent className="pb-2 pt-3">
            <DayCountAreaChart data={totalsByDay} />
          </BentoContent>
        </Bento>

        <BentoCounts header="By Name Counts" items={totalsByName} />
      </WebAppMain>
    </>
  );
}
