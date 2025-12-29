import dayjs from "dayjs";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
import { useTx } from "~/components/pages/tx/get/tx-provider";
import { UserAvatarOrPlaceholder } from "~/components/pages/user/user-avatar";
import { useUser, useUsersByIds } from "~/components/provider/users-provider";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import type { MainEvent } from "~/lib/consts/types";
import { formatDateTime } from "~/lib/dates/format-dates";
import { formatListItems } from "~/lib/format/format";

type ActivityItemBase<T> = T & {
  userId: string;
  createdAt: string;
};

type ActivityItemSingle = ActivityItemBase<{
  type: "created" | "archived" | "joined" | "left" | "updated";
}>;

type ActivityItemMultiple = ActivityItemBase<{
  type: "added" | "removed" | "amount_changed";
  targetUserIds: string[];
}>;

type ActivityItem = ActivityItemSingle | ActivityItemMultiple;

export const TxActivity = () => {
  const { t } = useTranslation();
  const { tx } = useTx();
  const items = useMemo(() => createActivityItems(tx.events), [tx.events]);

  if (items.length === 0) return null;

  return (
    <Bento className="gap-3">
      <div className="w-full font-semibold capitalize">{t("activity")}</div>
      <List>
        {items.map((item) => (
          <TxActivityItem key={item.createdAt + item.type} item={item} />
        ))}
      </List>
    </Bento>
  );
};

const TxActivityItem = ({ item }: { item: ActivityItem }) => {
  const user = useUser(item.userId);

  return (
    <ListItem>
      <ListItemLeft size="sm">
        <UserAvatarOrPlaceholder user={user} size="md" />
      </ListItemLeft>
      <ListItemBody className="h-fit whitespace-normal pl-1 text-sm leading-tight">
        <div>
          <ActivityItemCopy item={item} />
          <div className="mt-0.5 text-xs text-hint">
            {formatDateTime(item.createdAt)}
          </div>
        </div>
      </ListItemBody>
    </ListItem>
  );
};

const ActivityItemCopy = ({ item }: { item: ActivityItem }) => {
  switch (item.type) {
    case "created":
    case "archived":
    case "joined":
    case "left":
    case "updated":
      return <ActivitySingleCopy item={item} />;
    case "added":
    case "removed":
    case "amount_changed":
      return <ActivityMultipleCopy item={item} />;
  }
};

const ActivityMultipleCopy = ({ item }: { item: ActivityItemMultiple }) => {
  const { t } = useTranslation();
  const user = useUser(item.userId);
  const users = useUsersByIds(item.targetUserIds);

  const name = user?.name ?? "";
  const names = users.map((user) => user?.name ?? "");
  const targets = formatListItems(names);

  switch (item.type) {
    case "added":
      return <>{t("log_tx_added", { name, targets })}</>;
    case "removed":
      return <>{t("log_tx_removed", { name, targets })}</>;
    case "amount_changed":
      return <>{t("log_tx_amount_changed", { name, targets })}</>;
  }
};

const ActivitySingleCopy = ({ item }: { item: ActivityItemSingle }) => {
  const { t } = useTranslation();
  const user = useUser(item.userId);
  const name = user?.name ?? "";

  switch (item.type) {
    case "created":
      return <>{t("log_tx_created", { name })}</>;
    case "archived":
      return <>{t("log_tx_archived", { name })}</>;
    case "joined":
      return <>{t("log_tx_joined", { name })}</>;
    case "left":
      return <>{t("log_tx_left", { name })}</>;
    case "updated":
      return <>{t("log_tx_updated", { name })}</>;
  }
};

function createActivityItems(events: MainEvent[]): ActivityItem[] {
  const sorted = events.sort((a, b) => b.id - a.id);

  const items: ActivityItem[] = [];
  let currentGroup: MainEvent[] = [];
  let currentGroupTime: dayjs.Dayjs | null = null;

  for (const event of sorted) {
    const eventTime = dayjs(event.createdAt);

    if (
      currentGroupTime &&
      currentGroup[0]?.name === event.name &&
      currentGroup[0]?.createdById === event.createdById &&
      eventTime.diff(currentGroupTime, "minute") < 1
    ) {
      currentGroup.push(event);
      continue;
    }

    if (currentGroup.length > 0) {
      const item = createActivityItem(currentGroup);
      if (item) items.push(item);
    }

    currentGroup = [event];
    currentGroupTime = eventTime;
  }

  if (currentGroup.length > 0) {
    const item = createActivityItem(currentGroup);
    if (item) items.push(item);
  }

  return items;
}

function createActivityItem(events: MainEvent[]): ActivityItem | null {
  const firstEvent = events[0];
  if (!firstEvent) return null;

  const { createdAt, createdById: userId } = firstEvent;
  if (!userId) return null;

  const targetUserIds = getTargetUserIds(events);

  switch (firstEvent.name) {
    case "tx_created":
      return { type: "created", createdAt, userId };
    case "tx_updated":
      return { type: "updated", createdAt, userId };
    case "tx_archived":
      return { type: "archived", createdAt, userId };
    case "tx_joined": {
      const isCreatorOnly = events.every((e) => userId === e.targetUserId);
      if (isCreatorOnly) {
        return { type: "joined", createdAt, userId };
      }
      if (targetUserIds.length === 0) return null;
      return { type: "added", createdAt, userId, targetUserIds };
    }
    case "tx_left":
      const isCreatorOnly = events.every((e) => userId === e.targetUserId);
      if (isCreatorOnly) {
        return { type: "left", createdAt, userId };
      }
      if (targetUserIds.length === 0) return null;
      return { type: "removed", createdAt, userId, targetUserIds };
    case "amount_updated":
      if (targetUserIds.length === 0) return null;
      return { type: "amount_changed", createdAt, userId, targetUserIds };
    default:
      return null;
  }
}

function getTargetUserIds(events: MainEvent[]) {
  return events.map((e) => e.targetUserId ?? "").filter(Boolean);
}
