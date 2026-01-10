import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";
import { queries, schema, type DbCtx, type DbUserCtx } from "~/server/db";
import type { InsertGroup } from "~/server/db/types";

export async function updateById(
  ctx: DbCtx,
  id: string,
  params: Partial<InsertGroup>,
) {
  await ctx.db
    .update(schema.group)
    .set({
      ...params,
    })
    .where(eq(schema.group.id, id));
}

interface MemberParams {
  userId: string;
  role?: "ADMIN" | "MEMBER";
}

export async function create(
  ctx: DbUserCtx,
  params: {
    name: string;
    accentColorId: number;
    members: MemberParams[];
  },
) {
  if (params.members.length === 0) {
    throw new Error("Group must have at least one member");
  }

  const id = createId();
  const [group] = await ctx.db.batch([
    ctx.db
      .insert(schema.group)
      .values({
        id: id,
        createdById: ctx.userId,
        name: params.name,
        accentColorId: params.accentColorId,
      })
      .returning(),
    ctx.db.insert(schema.membership).values(
      params.members.map((m) => ({
        ...m,
        id: createId(),
        groupId: id,
      })),
    ),
    ctx.db.insert(schema.event).values([
      {
        name: "group_created" as const,
        createdById: ctx.userId,
        groupId: id,
      },
      ...params.members.map((m) => ({
        name: "group_joined" as const,
        createdById: ctx.userId,
        groupId: id,
        targetUserId: m.userId,
      })),
    ]),
  ]);

  return group[0]!;
}

async function createByTgId(
  ctx: DbCtx,
  params: {
    createdById: string;
    telegramId: number;
    name: string;
    tgChatType: string;
    members: MemberParams[];
  },
) {
  if (params.members.length === 0) {
    throw new Error("Group must have at least one member");
  }

  const id = await ctx.db.transaction(async (tx) => {
    const returned = await tx
      .insert(schema.group)
      .values({
        id: createId(),
        createdById: params.createdById,
        name: params.name,
        telegramId: params.telegramId,
        tgChatType: params.tgChatType,
        tgLinked: true,
      })
      .onConflictDoNothing({ target: schema.group.telegramId })
      .returning({ id: schema.group.id });

    const returnedId = returned[0]?.id;
    if (!returnedId) return null;

    await tx.insert(schema.membership).values(
      params.members.map((m) => ({
        ...m,
        id: createId(),
        groupId: returnedId,
      })),
    );

    await tx.insert(schema.event).values([
      {
        name: "group_created" as const,
        createdById: params.createdById,
        groupId: returnedId,
      },
      ...params.members.map((m) => ({
        name: "group_joined" as const,
        createdById: params.createdById,
        groupId: returnedId,
        targetUserId: m.userId,
      })),
      {
        name: "group_linked" as const,
        createdById: params.createdById,
        groupId: returnedId,
      },
    ]);

    return returnedId;
  });

  if (id) return id;

  const group = await ctx.db.query.group.findFirst({
    where: (v, { eq }) => eq(v.telegramId, params.telegramId),
  });
  if (!group) {
    throw new Error(`Group not found after creation ${params.telegramId}`);
  }
  return group.id;
}

export async function getOrCreateByTgId(
  ctx: DbCtx,
  params: {
    telegramId: number;
    name: string;
    creatorId: string;
    tgChatType: string;
  },
) {
  const existing = await queries.group.getByTgId(ctx, params.telegramId);
  if (existing) return { groupId: existing.id, isNew: false };

  const id = await createByTgId(ctx, {
    createdById: params.creatorId,
    telegramId: params.telegramId,
    name: params.name,
    tgChatType: params.tgChatType,
    members: [{ userId: params.creatorId, role: "ADMIN" }],
  });
  return { groupId: id, isNew: true };
}

export async function linkByTgId(ctx: DbCtx, telegramId: number) {
  const group = await ctx.db.query.group.findFirst({
    where: (v, { eq }) => eq(v.telegramId, telegramId),
    columns: { id: true, tgLinked: true },
  });
  if (!group) return;
  if (group.tgLinked) return;

  await ctx.db.batch([
    ctx.db
      .update(schema.group)
      .set({ tgLinked: true })
      .where(eq(schema.group.id, group.id)),
    ctx.db.insert(schema.event).values({
      name: "group_linked" as const,
      groupId: group.id,
    }),
  ]);
}

export async function unlinkByTgId(ctx: DbCtx, telegramId: number) {
  const group = await queries.group.getByTgId(ctx, telegramId);
  if (!group) return;

  await ctx.db.batch([
    ctx.db
      .update(schema.group)
      .set({ tgLinked: false })
      .where(eq(schema.group.id, group.id)),
    ctx.db.insert(schema.event).values({
      name: "group_unlinked" as const,
      groupId: group.id,
    }),
  ]);
}

export async function upsertMembers(
  ctx: DbCtx,
  params: {
    groupId: string;
    userIds: string[];
    createdById: string;
  },
) {
  if (params.userIds.length === 0) return;

  const existing = await ctx.db.query.membership.findMany({
    where: (v, { eq, and, inArray }) =>
      and(eq(v.groupId, params.groupId), inArray(v.userId, params.userIds)),
  });

  const missing = params.userIds.filter(
    (userId) => !existing.some((m) => m.userId === userId),
  );

  if (missing.length === 0) return;

  await ctx.db.batch([
    ctx.db.insert(schema.membership).values(
      missing.map((userId) => ({
        id: createId(),
        groupId: params.groupId,
        userId,
      })),
    ),
    ctx.db.insert(schema.event).values(
      missing.map((userId) => ({
        name: "group_joined" as const,
        createdById: params.createdById,
        groupId: params.groupId,
        targetUserId: userId,
      })),
    ),
  ]);
}

export async function archive(ctx: DbUserCtx, groupId: string) {
  await ctx.db.batch([
    ctx.db
      .update(schema.group)
      .set({ archivedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(schema.group.id, groupId)),
    ctx.db.insert(schema.event).values({
      name: "group_archived" as const,
      createdById: ctx.userId,
      groupId,
    }),
  ]);
}
