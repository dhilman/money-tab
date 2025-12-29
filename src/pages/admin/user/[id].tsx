import { useRouter } from "next/router";
import { AdminUserPage } from "~/components/admin/user-page";
import { api } from "~/utils/api";

import { webAppPage } from "~/components/provider/webapp-provider";

export default webAppPage(Page);
function Page() {
  const router = useRouter();
  const { id } = router.query;
  const { data } = api.admin.user.useQuery(id as string, {
    enabled: !!id,
  });
  if (!data) return <div />;

  return <AdminUserPage {...data} />;
}
