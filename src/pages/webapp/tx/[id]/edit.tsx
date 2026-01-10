import { TxEditProvider } from "~/components/pages/tx/edit/tx-edit-provider";
import { TxEditPage } from "~/components/pages/tx/form/tx-form-page";
import { webAppPage } from "~/components/provider/webapp-provider";
import { useTypedQuery } from "~/components/router/router";
import { api } from "~/utils/api";

export default webAppPage(Page);
function Page() {
  const { id } = useTypedQuery("/webapp/tx/[id]/edit");
  const { data } = api.tx.get.useQuery(
    { id: id },
    {
      enabled: !!id,
    },
  );

  if (!data) return null;

  return (
    <TxEditProvider tx={data}>
      <TxEditPage />
    </TxEditProvider>
  );
}
