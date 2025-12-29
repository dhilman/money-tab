import { useRouter } from "next/router";
import { SubCreatePage } from "~/components/pages/sub/create/sub-create-page";
import { SubFormProvider } from "~/components/pages/sub/create/sub-create-provider";
import { MustAuthProvider } from "~/components/provider/auth/must-auth-provider";
import { webAppPage } from "~/components/provider/webapp-provider";

const useQueryParams = () => {
  const router = useRouter();
  const { userId, groupId } = router.query;
  return {
    userId: typeof userId === "string" ? userId : null,
    groupId: typeof groupId === "string" ? groupId : null,
  };
};

export default webAppPage(Page);
function Page() {
  const { userId, groupId } = useQueryParams();
  return (
    <MustAuthProvider>
      <SubFormProvider userId={userId} groupId={groupId}>
        <SubCreatePage />
      </SubFormProvider>
    </MustAuthProvider>
  );
}
