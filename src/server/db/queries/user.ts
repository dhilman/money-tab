import { and, eq } from "drizzle-orm";
import { type DbCtx } from "~/server/db";

export const SelectUserColumns = {
  columns: {
    id: true,
    firstName: true,
    lastName: true,
    username: true,
    photoUrl: true,
    accentColorId: true,
  },
} as const;

export const SelectUserNotifyColumns = {
  columns: {
    id: true,
    telegramId: true,
    isRegistered: true,
    languageCode: true,
  },
} as const;

export async function byIdForNotify(ctx: DbCtx, id: string) {
  return ctx.db.query.user.findFirst({
    where: (v) => eq(v.id, id),
    columns: SelectUserNotifyColumns.columns,
  });
}

export async function byIdsForNotify(ctx: DbCtx, ids: string[]) {
  return ctx.db.query.user.findMany({
    where: ({ id }, { inArray }) => inArray(id, ids),
    columns: SelectUserNotifyColumns.columns,
  });
}

export function connections(ctx: DbCtx, userId: string) {
  return ctx.db.query.connection.findMany({
    where: ({ ownerId }) => eq(ownerId, userId),
    with: {
      user: SelectUserColumns,
    },
  });
}

export async function connectionBetween(
  ctx: DbCtx,
  ownerUserId: string,
  otherUserId: string,
) {
  return ctx.db.query.connection.findFirst({
    where: (v) => and(eq(v.ownerId, ownerUserId), eq(v.userId, otherUserId)),
  });
}
