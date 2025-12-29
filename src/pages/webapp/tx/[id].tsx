import { TxPage } from "~/components/pages/tx/get/tx-page";
import { TxProvider } from "~/components/pages/tx/get/tx-provider";
import { webAppPage } from "~/components/provider/webapp-provider";
import { useTypedQuery } from "~/components/router/router";

export default webAppPage(Page);
function Page() {
  const params = useTypedQuery("/webapp/tx/[id]");

  if (!params || !params.id) return null;

  return (
    <TxProvider shortId={params.id} shortContribId={params.contribId}>
      <TxPage />
    </TxProvider>
  );
}
