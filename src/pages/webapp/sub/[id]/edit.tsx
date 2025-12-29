import { SubEditPage } from "~/components/pages/sub/edit/sub-edit-page";
import { SubEditProvider } from "~/components/pages/sub/edit/sub-edit-provider";
import { webAppPage } from "~/components/provider/webapp-provider";
import { useTypedQuery } from "~/components/router/router";
import { api } from "~/utils/api";

export default webAppPage(Page);
function Page() {
  const { id } = useTypedQuery("/webapp/sub/[id]/edit");
  const { data } = api.sub.get.useQuery(
    { id },
    {
      enabled: !!id,
    }
  );

  if (!data) return null;

  return (
    <SubEditProvider sub={data}>
      <SubEditPage />
    </SubEditProvider>
  );
}
