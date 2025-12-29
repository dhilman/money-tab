import { useRouter } from "next/router";
import { GroupEditPage } from "~/components/pages/group/edit/group-edit-page";
import { GroupEditProvider } from "~/components/pages/group/edit/group-edit-provider";
import { webAppPage } from "~/components/provider/webapp-provider";

export default webAppPage(Page);
function Page() {
  const router = useRouter();
  const { id } = router.query;

  if (typeof id !== "string" || !id) return null;

  return (
    <GroupEditProvider id={id}>
      <GroupEditPage />
    </GroupEditProvider>
  );
}
