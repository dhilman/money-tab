import { useRouter } from "next/router";
import { UserPage } from "~/components/pages/user/get/user-page";
import { UserProvider } from "~/components/pages/user/get/user-provider";
import { webAppPage } from "~/components/provider/webapp-provider";

export default webAppPage(Page);
function Page() {
  const router = useRouter();
  const { id } = router.query;

  if (typeof id !== "string" || !id) return null;

  return (
    <UserProvider shortUserId={id}>
      <UserPage />
    </UserProvider>
  );
}
