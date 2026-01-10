import dayjs from "dayjs";
import React, { useMemo } from "react";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { MyLink } from "~/components/router/link";
import { Button } from "~/components/ui/button";
import { formatDateTimeRelative } from "~/lib/dates/format-date-relative";
import type { RouterOutputs } from "~/utils/api";

type RecentSession = RouterOutputs["admin"]["sessions"][number];

interface Props {
  sessions: RecentSession[];
}

export const BentoSessions = ({ sessions }: Props) => {
  if (sessions.length === 0) return null;
  return (
    <Bento>
      <BentoHeader>Recent Sessions</BentoHeader>
      <BentoContent className="flex w-full flex-col gap-1 p-2">
        {sessions.map((session, i) => (
          <div key={session.id} className="flex w-full flex-col gap-1">
            <Session key={session.id} session={session} />
            {i < sessions.length - 1 && (
              <div className="h-px w-full bg-hint/20" />
            )}
          </div>
        ))}
      </BentoContent>
    </Bento>
  );
};

const Session = ({ session }: { session: RecentSession }) => {
  const [expaned, setExpanded] = React.useState(false);
  const duration = useMemo(() => {
    if (session.endAt) {
      return dayjs(session.endAt).diff(session.startAt, "seconds");
    }
    return dayjs(session.lastActiveAt).diff(session.startAt, "seconds");
  }, [session]);

  function OptBadge({ text }: { text: string | null }) {
    if (!text) return null;
    return (
      <div className="rounded-sm bg-orange-500/10 px-2 text-xs text-orange-500">
        {text}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-1 rounded-md p-1.5">
      {session.userId && (
        <MyLink
          route={{
            pathname: "/admin/user/[id]",
            query: { id: session.userId ?? "" },
          }}
          className="truncate text-xs font-medium text-primary"
        >
          {session.userId}
        </MyLink>
      )}
      <div className="flex w-full gap-2">
        <div className="text-sm font-semibold">
          {formatDateTimeRelative(session.startAt)}
        </div>
        {duration > 0 && (
          <div className="ml-auto text-sm text-hint">
            {duration} sec
            {session.endAt ? " (end)" : ""}
          </div>
        )}
      </div>
      <div className="flex w-full gap-2">
        <div className="flex w-full flex-wrap items-center gap-2">
          <OptBadge text={session.country} />
          <OptBadge text={session.os} />
          <OptBadge text={session.browser} />
          <OptBadge text={session.deviceModel} />
        </div>
        <Button size="xs" onClick={() => setExpanded(!expaned)}>
          {expaned ? "Hide" : "Show"}
        </Button>
      </div>
      {expaned && (
        <div className="mt-1 flex w-full flex-col gap-1.5">
          {session.events.map((event) => (
            <SessionEvent key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

interface SessionEventProps {
  event: RecentSession["events"][number];
}

const SessionEvent = ({ event }: SessionEventProps) => {
  return (
    <div className="w-full">
      <div className="flex w-full items-center text-xs">
        <div className="text-hint">
          {dayjs(event.timestamp).format("HH:mm:ss")}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {event.loadTime && (
            <div className="rounded-full bg-hint/10 px-2">
              plt: {event.loadTime}ms
            </div>
          )}
          {event.interactiveTime && (
            <div className="rounded-full bg-hint/10 px-2">
              pit: {event.interactiveTime}ms
            </div>
          )}
        </div>
      </div>
      <div className="w-full truncate text-sm text-hint">{event.path}</div>
    </div>
  );
};
