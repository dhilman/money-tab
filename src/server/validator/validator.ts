import { TRPCError } from "@trpc/server";
import { countDistinct, eq, inArray } from "drizzle-orm";
import { env } from "~/env.mjs";
import type { Visibility } from "~/lib/consts/types";
import { calcIsPublic } from "~/lib/visibility";
import type { MyContext } from "~/server/api/trpc";
import { schema } from "~/server/db";

export function id(id: string) {
  if (env.NEXT_PUBLIC_ENV !== "prod") return;
  if (id.length < 10) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid ID",
    });
  }
}

export function exists<T>(
  item: T | null | undefined,
  message = "Not found"
): asserts item is T {
  if (!item) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: message,
    });
  }
}

export function isCreator(
  ctx: MyContext,
  creatorId: string,
  message = "Access denied"
) {
  if (ctx.user.id !== creatorId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: message,
    });
  }
}

export function notCreator(
  ctx: MyContext,
  creatorId: string,
  message = "Can not perform action as creator"
) {
  if (ctx.user.id === creatorId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: message,
    });
  }
}

export async function isGroupMember(ctx: MyContext, groupId: string | null) {
  if (!groupId) return;

  const membership = await ctx.db.query.membership.findFirst({
    where: (v, { eq, and }) =>
      and(eq(v.groupId, groupId), eq(v.userId, ctx.userId)),
  });

  if (!membership) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Group not found",
    });
  }
}

export function contribAmounts(
  total: number,
  contribs: {
    amountPaid: number;
    amountOwed: number;
  }[]
) {
  if (contribs.some((c) => c.amountPaid < 0 || c.amountOwed < 0)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Amounts should be positive",
    });
  }

  const totalAmountOwed = contribs.reduce((acc, c) => acc + c.amountOwed, 0);
  if (totalAmountOwed !== 0 && totalAmountOwed !== total) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Amount owed should be 0 or equal to total",
    });
  }

  const totalAmountPaid = contribs.reduce((acc, c) => acc + c.amountPaid, 0);
  if (totalAmountPaid !== 0 && totalAmountPaid !== total) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Amount paid should be 0 or equal to total",
    });
  }
  if (contribs.filter((c) => c.amountPaid > 0).length > 1) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only one person can be the payer",
    });
  }
}

/**
 * Checks that caller is in contribs and that each valid userId is unique
 * Returns a list of unique user IDs (excluding the caller)
 */
export function contribUserIds(
  ctx: MyContext,
  contribs: { userId: string | null }[]
) {
  const userIds = contribs
    .filter((c) => c.userId)
    .map((c) => c.userId as string);

  const setUserIds = new Set(userIds);
  if (!setUserIds.has(ctx.user.id)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You must be involved",
    });
  }

  if (setUserIds.size !== userIds.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Multiple contributions for the same user",
    });
  }

  setUserIds.delete(ctx.user.id);
  return Array.from(setUserIds);
}

export async function inGroup(
  ctx: MyContext,
  groupId: string,
  userIds: string[]
) {
  const members = await ctx.db.query.membership.findMany({
    columns: { userId: true },
    where: (v, { eq, inArray, and }) =>
      and(eq(v.groupId, groupId), inArray(v.userId, userIds)),
  });

  if (members.length !== userIds.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Users not in group",
    });
  }

  return members;
}

export async function contacts(ctx: MyContext, userIds: string[]) {
  const others = userIds.filter((id) => id !== ctx.userId);
  if (others.length === 0) return [];

  const connections = await ctx.db.query.connection.findMany({
    columns: { userId: true },
    where: (v, { eq, and, inArray }) =>
      and(eq(v.ownerId, ctx.userId), inArray(v.userId, others)),
  });

  if (connections.length !== others.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Users not in contacts",
    });
  }

  return connections;
}

export async function contactOrShareGroup(ctx: MyContext, userId: string) {
  const connection = await ctx.db.query.connection.findFirst({
    where: (v, { eq, and }) =>
      and(eq(v.ownerId, ctx.userId), eq(v.userId, userId)),
  });
  if (connection) return;

  const groups = await ctx.db
    .select({ id: schema.membership.groupId })
    .from(schema.membership)
    .where(inArray(schema.membership.userId, [ctx.userId, userId]))
    .groupBy(({ id }) => id)
    .having(eq(countDistinct(schema.membership.userId), 2));

  if (groups.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User not in contacts or share group",
    });
  }
}

export async function contactsOrInGroup(
  ctx: MyContext,
  userIds: string[],
  groupId: string | null
) {
  const filteredUserIds = userIds.filter((id) => id !== ctx.userId);
  if (filteredUserIds.length === 0) return;

  const connections = await ctx.db.query.connection.findMany({
    columns: { userId: true },
    where: (v, { eq, and, inArray }) =>
      and(eq(v.ownerId, ctx.userId), inArray(v.userId, filteredUserIds)),
  });

  const notConnectedIds = filteredUserIds.filter(
    (id) => !connections.some((c) => c.userId === id)
  );
  if (notConnectedIds.length === 0) {
    return;
  }

  if (!groupId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Users not in contacts",
    });
  }

  await inGroup(ctx, groupId, notConnectedIds);
}

export async function joinable(
  ctx: MyContext,
  params: {
    createdAt: string;
    visibility: Visibility;
    groupId: string | null;
  }
) {
  const joinable = calcIsPublic(params);
  if (joinable) return;

  if (!params.groupId) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  await isGroupMember(ctx, params.groupId);
}

export function isParticipant<T extends { userId: string | null }>(
  ctx: MyContext,
  contribs: T[]
) {
  const contrib = contribs.find((v) => v.userId === ctx.userId);
  if (!contrib) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a participant",
    });
  }
  return contrib;
}
