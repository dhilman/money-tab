import { useRouter } from "next/router";
import { GroupPage } from "~/components/pages/group/get/group-page";
import { GroupProvider } from "~/components/pages/group/get/group-provider";
import { webAppPage } from "~/components/provider/webapp-provider";

export default webAppPage(Page);
function Page() {
  const router = useRouter();
  const { id } = router.query;

  if (typeof id !== "string" || !id) return null;

  return (
    <GroupProvider shortId={id}>
      <GroupPage />
    </GroupProvider>
  );
}
