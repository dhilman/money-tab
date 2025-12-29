import { useRouter } from "next/router";
import { TxListPage } from "~/components/pages/tx/list/tx-list-page";

import { webAppPage } from "~/components/provider/webapp-provider";

export default webAppPage(Page);
function Page() {
  const router = useRouter();
  const { userId, groupId } = router.query;
  return (
    <TxListPage
      userId={typeof userId === "string" ? userId : null}
      groupId={typeof groupId === "string" ? groupId : null}
    />
  );
}
