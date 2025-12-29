import { BentoIssuesList } from "~/components/admin/issues-list";
import { webAppPage } from "~/components/provider/webapp-provider";
import { api } from "~/utils/api";

export default webAppPage(Page);
function Page() {
  const { data } = api.admin.uniqueIssues.useQuery();

  if (!data) return <div />;

  return <BentoIssuesList issues={data} />;
}
