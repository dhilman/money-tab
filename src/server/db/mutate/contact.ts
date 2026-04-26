import { and, eq } from "drizzle-orm";
import { type DbUserCtx, db, queries, schema } from "~/server/db";

export async function upsert(ctx: DbUserCtx, otherUserId: string) {
  if (ctx.userId === otherUserId) return;
  const existing = await queries.user.connectionBetween(
    ctx,
    ctx.userId,
    otherUserId,
  );
  if (existing) return;

  await ctx.db.transaction(async (tx) => {
    await tx.insert(schema.connection).values([
      { ownerId: ctx.userId, userId: otherUserId },
      { ownerId: otherUserId, userId: ctx.userId },
    ]);
    await tx.insert(schema.event).values({
      name: "user_connected",
      createdById: ctx.userId,
      targetUserId: otherUserId,
    });
  });
}

export async function remove(
  ctx: DbUserCtx,
  userId: string,
  otherUserId: string,
) {
  await ctx.db.transaction(async (tx) => {
    await tx
      .delete(schema.connection)
      .where(
        and(
          eq(schema.connection.ownerId, userId),
          eq(schema.connection.userId, otherUserId),
        ),
      );
    await tx
      .delete(schema.connection)
      .where(
        and(
          eq(schema.connection.ownerId, otherUserId),
          eq(schema.connection.userId, userId),
        ),
      );
    await tx.insert(schema.event).values({
      name: "user_disconnected",
      createdById: userId,
      targetUserId: otherUserId,
    });
  });
}

export async function updateNickname(params: {
  callerUserId: string;
  userId: string;
  nickname: string;
}) {
  await db
    .update(schema.connection)
    .set({ nickname: params.nickname })
    .where(
      and(
        eq(schema.connection.ownerId, params.callerUserId),
        eq(schema.connection.userId, params.userId),
      ),
    );
}
