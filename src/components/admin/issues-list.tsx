import { useState } from "react";
import toast from "react-hot-toast";
import { adminFormatDate } from "~/components/admin/admin-utils";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { Nav, NavButtonRight, NavTitle } from "~/components/common/layout/nav";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { MyLink } from "~/components/router/link";
import { Checkbox } from "~/components/ui/checkbox";
import { api, type RouterOutputs } from "~/utils/api";

type Issue = RouterOutputs["admin"]["uniqueIssues"][number];

interface Props {
  issues: Issue[];
}

export const BentoIssuesList = ({ issues }: Props) => {
  const ctx = api.useUtils();
  const [selectedHashes, setSelectedHashes] = useState<string[]>([]);
  const resolve = api.admin.resolve.useMutation({
    onSuccess: () => {
      setSelectedHashes([]);
      void ctx.admin.uniqueIssues.invalidate();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to resolve issue");
    },
  });

  return (
    <>
      <Nav>
        <NavTitle>Issues ({issues.length})</NavTitle>
        <NavButtonRight
          onClick={() => {
            resolve.mutate({ hashes: selectedHashes });
          }}
          disabled={selectedHashes.length === 0}
          isLoading={resolve.isPending}
        >
          Resolve {selectedHashes.length > 0 && `(${selectedHashes.length})`}
        </NavButtonRight>
      </Nav>

      <WebAppMain className="flex w-full max-w-4xl flex-col gap-6 py-6">
        <Bento>
          <BentoHeader>Issues ({issues.length})</BentoHeader>
          <BentoContent>
            <div className="flex w-full flex-col gap-0.5 p-1">
              {issues.map((issue, i) => (
                <div key={issue.hash} className="flex w-full flex-col gap-0.5">
                  <IssueListItem
                    issue={issue}
                    selected={selectedHashes.includes(issue.hash)}
                    onToggle={() => {
                      setSelectedHashes((prev) =>
                        prev.includes(issue.hash)
                          ? prev.filter((hash) => hash !== issue.hash)
                          : [...prev, issue.hash],
                      );
                    }}
                  />
                  {i < issues.length - 1 && (
                    <div className="h-px w-full bg-hint/20" />
                  )}
                </div>
              ))}
            </div>
          </BentoContent>
        </Bento>
      </WebAppMain>
    </>
  );
};

interface IssueListItemProps {
  issue: Issue;
  selected: boolean;
  onToggle: () => void;
}

const IssueListItem = ({ issue, selected, onToggle }: IssueListItemProps) => {
  return (
    <div className="relative flex w-full flex-col gap-1.5 rounded-lg px-2 py-2">
      <MyLink
        route={{ pathname: "/admin/issue/[hash]", query: { hash: issue.hash } }}
        className="absolute top-0 left-0 z-10 h-full w-3/4"
      />
      <div className="flex w-full items-center justify-between gap-2 text-sm text-hint">
        <div className="inline-flex items-center gap-1.5">
          <span className="rounded-md bg-blue-500/5 px-3 text-blue-500">
            {adminFormatDate(issue.timestamp ?? "")}
          </span>
          <div className="h-1 w-1 rounded-full bg-hint" />
          <span className="rounded-md bg-red-500/10 px-3 text-red-500">
            {issue.count}
          </span>
        </div>
        <Checkbox checked={selected} onCheckedChange={onToggle} />
      </div>
      <div className="inline-flex flex-wrap items-center gap-1.5 text-sm">
        <span>{issue.path ?? "no-path"}</span>
        {issue.procedure && (
          <>
            <div className="h-1 w-1 rounded-full bg-hint" />
            <span>{issue.procedure}</span>
          </>
        )}
        <div className="h-1 w-1 rounded-full bg-hint" />
        <span>{issue.type}</span>
      </div>
      {issue.message && (
        <div className="w-full truncate text-left text-sm text-hint">
          {issue.message}
        </div>
      )}
    </div>
  );
};
