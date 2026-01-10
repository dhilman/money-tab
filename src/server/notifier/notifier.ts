import { tgNotify } from "~/server/bot/tg-send";
import { type DbCtx, queries } from "~/server/db";
import type { NotifyDataSingle } from "~/server/notifier/schema";
import { queueClient } from "~/server/queue/client";

interface User {
  id: string;
  telegramId: number | null;
  isRegistered: boolean | null;
  languageCode: string | null;
}

interface UserNotifiable {
  id: string;
  telegramId: number;
  isRegistered: boolean;
  languageCode: string | null;
}

export interface NotifyEvent {
  user: User;
  data: NotifyDataSingle;
}

export interface NotifyEventById {
  userId: string;
  data: NotifyDataSingle;
}

const canNotify = (u: User): u is UserNotifiable => {
  return u.telegramId !== null && u.isRegistered === true;
};

export const notify = async (user: User, data: NotifyDataSingle) => {
  if (!canNotify(user)) return;

  await queueClient.notification({ sendTo: user, data });
};

export const notifySync = async (user: User, data: NotifyDataSingle) => {
  if (!canNotify(user)) {
    return { success: false, userTgId: user.telegramId };
  }

  const result = await tgNotify(user, data);
  if (!result) {
    await queueClient.notification({ sendTo: user, data });
  }
  return result;
};

const filterNotifiable = (events: NotifyEvent[]) => {
  return events.filter((e) => canNotify(e.user)) as {
    user: UserNotifiable;
    data: NotifyDataSingle;
  }[];
};

export const notifyBatchSync = async (events: NotifyEvent[]) => {
  const filtered = filterNotifiable(events);
  const results = await Promise.all(
    filtered.map(async (e) => ({
      success: await tgNotify(e.user, e.data),
      id: e.user.id,
    })),
  );

  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    const failedUsers = filtered.filter((e) =>
      failed.some((f) => f.id === e.user.id),
    );
    await queueClient.notificationBatch(
      failedUsers.map((e) => ({ sendTo: e.user, data: e.data })),
    );
  }

  return {
    results,
    successes: results.filter((r) => r.success),
  };
};

export const manyByIds = async (
  ctx: DbCtx,
  userIds: string[],
  data: NotifyDataSingle,
) => {
  if (userIds.length === 0) return { results: [], successes: [] };
  const users = await queries.user.byIdsForNotify(ctx, userIds);
  if (users.length === 0) return { results: [], successes: [] };

  const filtered = filterNotifiable(users.map((u) => ({ user: u, data })));
  await queueClient.notificationBatch(
    filtered.map((e) => ({ sendTo: e.user, data: e.data })),
  );
};

export const manyByIdsSync = async (
  ctx: DbCtx,
  userIds: string[],
  data: NotifyDataSingle,
) => {
  if (userIds.length === 0) return { results: [], successes: [] };
  const users = await queries.user.byIdsForNotify(ctx, userIds);
  if (users.length === 0) return { results: [], successes: [] };

  return await notifyBatchSync(users.map((u) => ({ user: u, data })));
};

export const singleById = async (
  ctx: DbCtx,
  userId: string,
  data: NotifyDataSingle,
) => {
  const user = await queries.user.byIdForNotify(ctx, userId);
  if (!user) return { success: false, userTgId: null };

  return await notify(user, data);
};

export const singleByIdSync = async (
  ctx: DbCtx,
  userId: string,
  data: NotifyDataSingle,
) => {
  const user = await queries.user.byIdForNotify(ctx, userId);
  if (!user) return { success: false, userTgId: null };

  return await notifySync(user, data);
};

export const batchByIdsSync = async (ctx: DbCtx, events: NotifyEventById[]) => {
  if (events.length === 0) return { results: [], successes: [] };

  const users = await queries.user.byIdsForNotify(
    ctx,
    events.map((e) => e.userId),
  );
  if (users.length === 0) return { results: [], successes: [] };

  const eventsWithUsers = events.reduce((acc, e) => {
    const user = users.find((u) => u.id === e.userId);
    if (!user) return acc;
    return [...acc, { user, data: e.data }];
  }, [] as NotifyEvent[]);

  return await notifyBatchSync(eventsWithUsers);
};
