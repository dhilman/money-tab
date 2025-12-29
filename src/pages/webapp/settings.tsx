import { ClientComponent } from "~/components/common/client-component";
import { Settings } from "~/components/pages/settings/settings-page";
import { webAppPage } from "~/components/provider/webapp-provider";

export default webAppPage(Page);
function Page() {
  return (
    <ClientComponent>
      <Settings />
    </ClientComponent>
  );
}
