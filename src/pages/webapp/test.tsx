import { Home } from "~/components/pages/home/home-page";

import { webAppPage } from "~/components/provider/webapp-provider";

export default webAppPage(Page);
function Page() {
  return <Home />;
}
