import { SubListPage } from "~/components/pages/sub/list/sub-list-page";
import { webAppPage } from "~/components/provider/webapp-provider";

export default webAppPage(Page);
function Page() {
  return <SubListPage />;
}
