import {
  AdminDateRange,
  useDateRangeQuery,
} from "~/components/admin/admin-date-range";
import { DayCountAreaChart } from "~/components/admin/day-count-area-chart";
import { HistogramChart } from "~/components/admin/histogram-chart";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { NavDefault } from "~/components/common/layout/nav";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { webAppPage } from "~/components/provider/webapp-provider";
import { api } from "~/utils/api";

export default webAppPage(Page);
function Page() {
  const { value: dateRange, onChange: setDateRange } = useDateRangeQuery();
  const { data } = api.admin.pageViews.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  if (!data) return <div />;

  return (
    <>
      <NavDefault title="Page Views" />

      <WebAppMain className="flex w-full max-w-4xl flex-col gap-6 py-6">
        <div className="flex w-full items-center justify-between px-4">
          <div className="text-2xl font-semibold">Users</div>
          <AdminDateRange value={dateRange} onChange={setDateRange} />
        </div>

        <Bento>
          <BentoHeader>Page Views</BentoHeader>
          <BentoContent className="pb-2 pt-3">
            <DayCountAreaChart data={data.perDay} />
          </BentoContent>
        </Bento>
        <Bento>
          <BentoHeader>Load Times</BentoHeader>
          <BentoContent className="pb-2 pt-3">
            <HistogramChart
              data={data.loadTimes}
              valueKey="loadTime"
              bins={[0, 250, 500, 750, 1000, 1500, 2000, 3000, 5000]}
            />
          </BentoContent>
        </Bento>
        <Bento>
          <BentoHeader>Interactive Time</BentoHeader>
          <BentoContent className="pb-2 pt-3">
            <HistogramChart
              data={data.loadTimes}
              valueKey="interactiveTime"
              bins={[0, 250, 500, 750, 1000, 1500, 2000, 3000, 5000]}
            />
          </BentoContent>
        </Bento>
      </WebAppMain>
    </>
  );
}
