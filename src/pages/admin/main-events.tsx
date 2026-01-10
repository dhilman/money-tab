import { useRouter } from "next/router";
import {
  AdminDateRange,
  useDateRangeQuery,
} from "~/components/admin/admin-date-range";
import { BentoCounts } from "~/components/admin/bento-counts";
import { DayCountAreaChart } from "~/components/admin/day-count-area-chart";
import { HistogramChart } from "~/components/admin/histogram-chart";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { NavDefault } from "~/components/common/layout/nav";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { webAppPage } from "~/components/provider/webapp-provider";
import { MyLink } from "~/components/router/link";
import { useTypedQuery } from "~/components/router/router";
import { EVENT_NAMES } from "~/lib/consts/constants";
import { api } from "~/utils/api";

export default webAppPage(Page);
function Page() {
  const { value: dateRange, onChange: setDateRange } = useDateRangeQuery();
  const { event } = useTypedQuery("/admin/main-events");
  const { data } = api.admin.events.useQuery(
    {
      event: event,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
    {
      enabled: !!event,
    },
  );

  if (!data) return <div />;
  if (!event) return <div />;

  return (
    <>
      <NavDefault title="Events" />

      <WebAppMain className="flex w-full max-w-4xl flex-col gap-3 py-6">
        <div className="flex w-full items-center justify-between px-4">
          <div className="text-2xl font-semibold">Events</div>
          <AdminDateRange value={dateRange} onChange={setDateRange} />
        </div>
        <div className="flex w-full justify-end px-4">
          <SelectEventName />
        </div>

        <div className="flex w-full flex-col gap-6 pt-2 pb-4">
          <Bento>
            <BentoHeader>Per Day</BentoHeader>
            <BentoContent className="pt-3 pb-2">
              <DayCountAreaChart data={data.perDay} />
            </BentoContent>
          </Bento>

          <Bento>
            <BentoHeader>Per User</BentoHeader>
            <BentoContent className="pt-3 pb-2">
              <HistogramChart
                data={data.perUser}
                valueKey="count"
                bins={[0, 1, 2, 3, 4, 5, 10, 20, 30]}
              />
            </BentoContent>
          </Bento>

          <BentoCounts
            header="Per User"
            items={data.perUser}
            labelFormatter={(label) => (
              <MyLink
                route={{ pathname: "/admin/user/[id]", query: { id: label } }}
                className="z-10 font-medium text-primary"
              >
                {label}
              </MyLink>
            )}
          />
        </div>
      </WebAppMain>
    </>
  );
}

const OPTIONS = EVENT_NAMES.map((name) => ({
  value: name,
  label: name.replace(/_/g, " "),
}));

const SelectEventName = () => {
  const { event } = useTypedQuery("/admin/main-events");
  const router = useRouter();

  return (
    <Select
      options={OPTIONS}
      value={event}
      onChange={(value) => {
        const query = { ...router.query, event: value };
        void router.push({ pathname: router.pathname, query });
      }}
    />
  );
};

interface Select<T extends string> {
  options: {
    value: T;
    label: string;
  }[];
  value: T;
  onChange: (value: T) => void;
}

const Select = <T extends string>({ options, value, onChange }: Select<T>) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="rounded-md border border-hint/10 bg-background px-2 py-1"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
