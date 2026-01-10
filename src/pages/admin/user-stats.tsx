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
  const { data } = api.admin.userStats.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  if (!data) return <div />;
  return (
    <>
      <NavDefault title="User Stats" />

      <WebAppMain className="flex w-full max-w-4xl flex-col gap-6 py-6">
        <div className="flex w-full items-center justify-between px-4">
          <div className="text-2xl font-semibold">Users</div>
          <AdminDateRange value={dateRange} onChange={setDateRange} />
        </div>

        <Bento>
          <BentoHeader>Unique Users</BentoHeader>
          <BentoContent className="pt-3 pb-2">
            <DayCountAreaChart data={data.users} />
          </BentoContent>
        </Bento>

        <BentoCounts header="Language Codes" items={data.langCodes} />
        <BentoCounts header="Countries" items={data.countries} />
        <BentoCounts header="OS" items={data.os} />
      </WebAppMain>
    </>
  );
}
