import { keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  AdminDateRange,
  useDateRangeQuery,
} from "~/components/admin/admin-date-range";
import { StatCard } from "~/components/admin/stat-card";
import { NavDefault } from "~/components/common/layout/nav";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { webAppPage } from "~/components/provider/webapp-provider";
import { api } from "~/utils/api";

export default webAppPage(Page);
function Page() {
  const { value: dateRange, onChange: setDateRange } = useDateRangeQuery();
  const { data } = api.admin.stats.useQuery(
    {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
    {
      placeholderData: keepPreviousData,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );
  const events = useMemo(() => {
    if (!data) return {};
    return {
      pageViews: data.events.find((e) => e.type === "page")?.count,
      notifications: data.events.find((e) => e.type === "notify")?.count,
      other: data.events.filter((e) => !["page", "notify"].includes(e.type)),
    };
  }, [data]);

  if (!data) return <div />;

  return (
    <>
      <NavDefault title="Admin Dashboard" />

      <WebAppMain className="flex w-full max-w-4xl flex-col gap-4 py-6">
        <div className="flex w-full items-center justify-between px-4">
          <div className="text-2xl font-semibold">Dashboard</div>
          <AdminDateRange value={dateRange} onChange={setDateRange} />
        </div>

        <div className="flex w-full flex-col gap-8">
          <div className="grid w-full grid-cols-1 gap-2 px-2 sm:grid-cols-2 sm:gap-3">
            <StatCard
              title="Users"
              value={data.users}
              route={{ pathname: "/admin/user-stats" }}
            />
            <StatCard
              title="Sessions"
              value={data.sessions}
              route={{ pathname: "/admin/sessions" }}
            />
            <StatCard
              title="Page Views"
              value={events.pageViews}
              route={{ pathname: "/admin/page-views" }}
            />
            <StatCard
              title="Issues"
              value={
                <>
                  {data.issues?.count ?? 0}
                  {data.issues?.unique ? (
                    <span className="ml-2 text-sm text-hint">
                      ({data.issues.unique} unique)
                    </span>
                  ) : null}
                </>
              }
              route={{ pathname: "/admin/issues" }}
            />
          </div>
          <div className="grid w-full grid-cols-1 gap-2 px-2 sm:grid-cols-2 sm:gap-3">
            <StatCard title="New Users" value={data.newUsers} />
            <StatCard
              route={{
                pathname: "/admin/main-events",
                query: { event: "tx_created" },
              }}
              title="Transactions"
              value={data.txs}
            />
            <StatCard
              route={{
                pathname: "/admin/main-events",
                query: { event: "sub_created" },
              }}
              title="Subscriptions"
              value={data.subs}
            />
            <StatCard
              route={{
                pathname: "/admin/main-events",
                query: { event: "group_created" },
              }}
              title="Groups"
              value={data.groups}
            />
            <StatCard
              route={{
                pathname: "/admin/main-events",
                query: { event: "user_connected" },
              }}
              title="Connections"
              value={data.connections ?? 0 / 2}
            />
          </div>
          <div className="grid w-full grid-cols-1 gap-2 px-2 sm:grid-cols-2 sm:gap-3">
            <StatCard
              title="Notifications"
              value={events.notifications}
              route={{
                pathname: "/admin/notifs",
              }}
            />
            {events.other &&
              events.other.map((e) => (
                <StatCard key={e.type} title={e.type} value={e.count} />
              ))}
          </div>
        </div>
      </WebAppMain>
    </>
  );
}
