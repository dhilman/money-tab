import toast from "react-hot-toast";
import { IssueDetails } from "~/components/admin/issue-details";
import {
  NavButtonRight,
  NavTitle,
  NavWithBack,
} from "~/components/common/layout/nav";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { webAppPage } from "~/components/provider/webapp-provider";
import { useTypedQuery } from "~/components/router/router";
import { api } from "~/utils/api";

export default webAppPage(Page);
function Page() {
  const { hash } = useTypedQuery("/admin/issue/[hash]");
  if (!hash) return <div />;

  return <Provider hash={hash} />;
}

interface Props {
  hash: string;
}

const Provider = ({ hash }: Props) => {
  const ctx = api.useUtils();
  const { data } = api.admin.issues.useQuery({ hash });
  const resolve = api.admin.resolve.useMutation({
    onSuccess: () => {
      toast.success("Issue resolved");
      ctx.admin.uniqueIssues.setData(undefined, (prev) => {
        if (!prev) return;
        return prev.filter((i) => i.hash !== data?.issue.hash);
      });
    },
    onError: (e) => {
      console.error(e);
      toast.error("Failed to resolve issue: " + e.message);
    },
  });

  if (!data) return <div />;

  return (
    <>
      <NavWithBack>
        <NavTitle>{data.issue.hash}</NavTitle>
        <NavButtonRight
          onClick={() => resolve.mutate({ hashes: [data.issue.hash] })}
          disabled={resolve.isPending}
          isLoading={resolve.isPending}
        >
          Resolve
        </NavButtonRight>
      </NavWithBack>

      <WebAppMain className="flex w-full max-w-4xl flex-col gap-6 py-6">
        <IssueDetails issue={data.issue} instances={data.instances} />
      </WebAppMain>
    </>
  );
};
