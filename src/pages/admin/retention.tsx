import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useMemo, useState } from "react";
import { BentoCounts } from "~/components/admin/bento-counts";
import { HistogramChart } from "~/components/admin/histogram-chart";
import { Bento, BentoContent } from "~/components/bento-box";
import { NavDefault } from "~/components/common/layout/nav";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { NativeSelect } from "~/components/form/native-select";
import { webAppPage } from "~/components/provider/webapp-provider";
import { MyLink } from "~/components/router/link";
import { Switch } from "~/components/ui/switch";
import type { EventName } from "~/lib/consts/constants";
import { dayjsUTC } from "~/lib/dates/dates";
import { api } from "~/utils/api";

dayjs.extend(utc);

const EVENT_NAMES: EventName[] = [
  "tx_created",
  "sub_created",
  "group_created",
  "user_connected",
];

export default webAppPage(Page);
function Page() {
  const [eventNames, setEventNames] = useState<EventName[]>([
    "tx_created",
    "sub_created",
    "group_created",
  ]);
  const [lastDays, setLastDays] = useState(2);

  const eventRange = useMemo(() => {
    return {
      startDate: dayjsUTC()
        .subtract(lastDays, "day")
        .startOf("day")
        .toISOString(),
      endDate: dayjsUTC().add(1, "day").toISOString(),
    };
  }, [lastDays]);

  const userRange = useMemo(() => {
    return {
      startDate: dayjsUTC().subtract(5, "years").toISOString(),
      endDate: dayjsUTC()
        .subtract(lastDays + 1, "day")
        .endOf("day")
        .toISOString(),
    };
  }, [lastDays]);

  const { data } = api.admin.eventsWithUserCreation.useQuery({
    events: eventNames,
    eventRange,
    userRange,
  });

  if (!data) return <div />;

  return (
    <>
      <NavDefault title="Events" />

      <WebAppMain className="flex w-full max-w-4xl flex-col gap-3 py-6">
        <div className="flex w-full items-center justify-between gap-4 px-4">
          <div>
            <div className="text-2xl font-semibold">Retention</div>
            <div className="text-hint">
              Events in the last {lastDays} day[s], by users who signed up
              earlier
            </div>
          </div>
          <NativeSelect
            value={lastDays.toString()}
            onChange={(v) => setLastDays(parseInt(v))}
            className="w-28 shrink-0 bg-background"
            options={[
              { label: "1 day", value: "1" },
              { label: "2 days", value: "2" },
              { label: "3 days", value: "3" },
              { label: "4 days", value: "4" },
              { label: "5 days", value: "5" },
            ]}
          />
        </div>

        <Bento>
          <BentoContent className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
            {EVENT_NAMES.map((event) => (
              <div key={event} className="flex flex-col gap-1">
                <Switch
                  checked={eventNames.includes(event)}
                  onCheckedChange={(checked) =>
                    setEventNames((prev) =>
                      checked
                        ? [...prev, event]
                        : prev.filter((e) => e !== event)
                    )
                  }
                />
                <div className="text-lg font-semibold">{event}</div>
              </div>
            ))}
          </BentoContent>
        </Bento>

        <Bento>
          <BentoContent className="pb-2 pt-3">
            <HistogramChart
              data={data.perUser}
              valueKey="count"
              bins={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            />
          </BentoContent>
        </Bento>

        <BentoCounts
          header="Per User"
          items={data.perUser.slice(0, 30)}
          labelFormatter={(label) => (
            <MyLink
              route={{ pathname: "/admin/user/[id]", query: { id: label } }}
              className="z-10 font-medium text-primary"
            >
              {label}
            </MyLink>
          )}
        />
      </WebAppMain>
    </>
  );
}
