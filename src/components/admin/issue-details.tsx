import { useState } from "react";
import { AdminTable, adminFormatDate } from "~/components/admin/admin-utils";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { MyLink } from "~/components/router/link";
import { Button } from "~/components/ui/button";
import { type RouterOutputs } from "~/utils/api";

type Issue = RouterOutputs["admin"]["issues"]["issue"];
type IssueInstance = RouterOutputs["admin"]["issues"]["instances"][number];

interface Props {
  issue: Issue;
  instances: IssueInstance[];
}

export const IssueDetails = ({ issue, instances }: Props) => {
  return (
    <>
      <Bento>
        <BentoContent>
          <AdminTable
            values={[
              { key: "Type", value: issue.type },
              { key: "Count", value: issue.count },
              { key: "Last Seen", value: adminFormatDate(issue.timestamp) },
              { key: "path", value: issue.path ?? "no-path" },
              { key: "procedure", value: issue.procedure },
              { key: "message", value: issue.message },
            ]}
          />
        </BentoContent>
      </Bento>
      {issue.stack && (
        <Bento>
          <BentoHeader>Stack</BentoHeader>
          <BentoContent>
            <pre className="overflow-x-auto p-2 text-sm whitespace-pre">
              {issue.stack}
            </pre>
          </BentoContent>
        </Bento>
      )}
      <Bento>
        <BentoHeader>Recent Occurrences</BentoHeader>
        <div className="flex w-full flex-col gap-2.5">
          {instances?.map((el) => (
            <BentoContent key={el.id} className="p-2">
              <IssueInstance issue={el} />
            </BentoContent>
          ))}
        </div>
      </Bento>
    </>
  );
};

interface IssueInstanceProps {
  issue: IssueInstance;
}

const IssueInstance = ({ issue }: IssueInstanceProps) => {
  return (
    <div className="w-full space-y-2">
      <AdminTable
        values={[
          { key: "At", value: adminFormatDate(issue.timestamp) },
          { key: "App", value: issue.appVersion?.slice(0, 7) },
          { key: "Code", value: issue.statusCode },
          {
            key: "User",
            value: (
              <MyLink
                route={{
                  pathname: "/admin/user/[id]",
                  query: { id: issue.userId ?? "" },
                }}
                className="text-primary font-medium"
              >
                {issue.userId}
              </MyLink>
            ),
          },
          { key: "Session", value: issue.sessionId },
        ]}
      />
      <IssueStack stack={issue.stack} />
      <IssueProperties properties={issue.properties} />
    </div>
  );
};

const IssueStack = ({ stack }: { stack: string | null }) => {
  const [expanded, setExpanded] = useState(false);
  if (!stack) return null;

  return (
    <div className="bg-canvas/50 w-full space-y-2 rounded-lg p-2">
      <div className="flex w-full items-center justify-between">
        <div className="text-sm font-semibold">Stack</div>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide" : "Show"}
        </Button>
      </div>
      {expanded && (
        <pre className="overflow-x-auto p-2 text-sm whitespace-pre">
          {stack}
        </pre>
      )}
    </div>
  );
};

const IssueProperties = ({ properties }: { properties: unknown }) => {
  const [expanded, setExpanded] = useState(false);

  if (!properties) return null;

  return (
    <div className="bg-canvas/50 w-full space-y-2 rounded-lg p-2">
      <div className="flex w-full items-center justify-between">
        <div className="text-sm font-semibold">Properties</div>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide" : "Show"}
        </Button>
      </div>
      {expanded && (
        <pre className="overflow-x-auto text-sm whitespace-pre-wrap">
          {JSON.stringify(properties, null, 2)}
        </pre>
      )}
    </div>
  );
};
