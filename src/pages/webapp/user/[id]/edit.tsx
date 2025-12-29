import { useRouter } from "next/router";
import { UserEditPage } from "~/components/pages/user/edit/user-edit-page";
import { webAppPage } from "~/components/provider/webapp-provider";

export default webAppPage(Page);
function Page() {
  const router = useRouter();
  const { id } = router.query;

  if (typeof id !== "string" || !id) return null;

  return <UserEditPage id={id} />;
}
