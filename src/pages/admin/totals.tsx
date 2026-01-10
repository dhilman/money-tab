import { keepPreviousData } from "@tanstack/react-query";
import { StatCard } from "~/components/admin/stat-card";
import { NavDefault } from "~/components/common/layout/nav";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { webAppPage } from "~/components/provider/webapp-provider";
import { api } from "~/utils/api";

export default webAppPage(Page);
function Page() {
  const { data } = api.admin.totals.useQuery(undefined, {
    placeholderData: keepPreviousData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (!data) return <div />;

  return (
    <>
      <NavDefault title="Admin Totals" />

      <WebAppMain className="flex w-full max-w-4xl flex-col gap-4 py-6">
        <div className="w-full px-4 text-2xl font-semibold">Totals</div>

        <div className="flex w-full flex-col gap-8">
          <div className="grid w-full grid-cols-1 gap-2 px-2 sm:grid-cols-2 sm:gap-3">
            <StatCard title="Users" value={data.users} />
            <StatCard title="Transactions" value={data.txs} />
            <StatCard title="Subscriptions" value={data.subs} />
            <StatCard title="Groups" value={data.groups} />
            <StatCard title="Connections" value={data.connections ?? 0 / 2} />
          </div>
        </div>
      </WebAppMain>
    </>
  );
}
