import { GroupCreatePage } from "~/components/pages/group/create/group-create-page";
import { GroupCreateProvider } from "~/components/pages/group/create/group-create-provider";
import { MustAuthProvider } from "~/components/provider/auth/must-auth-provider";
import { webAppPage } from "~/components/provider/webapp-provider";

export default webAppPage(Page);
function Page() {
  return (
    <MustAuthProvider>
      <GroupCreateProvider>
        <GroupCreatePage />
      </GroupCreateProvider>
    </MustAuthProvider>
  );
}
