import { SubPage } from "~/components/pages/sub/get/sub-page";
import { SubProvider } from "~/components/pages/sub/get/sub-provider";
import { webAppPage } from "~/components/provider/webapp-provider";
import { useTypedQuery } from "~/components/router/router";

export default webAppPage(Page);
function Page() {
  const { id, contribId, tab } = useTypedQuery("/webapp/sub/[id]");

  if (!id) return null;

  return (
    <SubProvider shortId={id} shortContribId={contribId} tab={tab}>
      <SubPage />
    </SubProvider>
  );
}
