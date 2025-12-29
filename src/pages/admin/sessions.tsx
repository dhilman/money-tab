import { BentoSessions } from "~/components/admin/bento-sessions";
import { NavDefault } from "~/components/common/layout/nav";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { webAppPage } from "~/components/provider/webapp-provider";
import { api } from "~/utils/api";

export default webAppPage(Page);
function Page() {
  const { data } = api.admin.sessions.useQuery({});
  return (
    <>
      <NavDefault title="Sessions" />

      <WebAppMain className="flex w-full max-w-4xl flex-col gap-6 py-6">
        <BentoSessions sessions={data || []} />
      </WebAppMain>
    </>
  );
}
