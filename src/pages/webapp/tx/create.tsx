import { useRouter } from "next/router";
import { TxCreateProvider } from "~/components/pages/tx/create/tx-create-provider";
import { TxEditPage } from "~/components/pages/tx/form/tx-form-page";
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
      <TxCreateProvider userId={userId} groupId={groupId}>
        <TxEditPage />
      </TxCreateProvider>
    </MustAuthProvider>
  );
}
