import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";
import { schema, type DbCtx } from "~/server/db";
import type { InsertEvent, InsertUser, SelectUser } from "~/server/db/types";

interface UserCreateParams {
  telegramId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  isRegistered?: boolean;
  tgIsPremium?: boolean;
  referrer?: string;
}

export async function create(ctx: DbCtx, params: UserCreateParams) {
  await ctx.db.transaction(async (tx) => {
    const returned = await tx
      .insert(schema.user)
      .values({
        id: createId(),
        telegramId: params.telegramId,
        firstName: params.firstName,
        lastName: params.lastName,
        username: params.username,
        languageCode: params.languageCode,
        isRegistered: params.isRegistered,
        tgIsPremium: params.tgIsPremium,
        referrer: params.referrer,
        meInPaidFor: true,
      })
      .onConflictDoNothing({ target: schema.user.telegramId })
      .returning({ id: schema.user.id });

    // If nothing is returned, then user already exists.
    const returnedId = returned[0]?.id;
    if (!returnedId) return;

    const events: InsertEvent[] = [];
    if (params.isRegistered) {
      events.push({ name: "user_registered", createdById: returnedId });
    }

    await tx
      .insert(schema.event)
      .values([{ name: "user_created", createdById: returnedId }, ...events]);

    return returnedId;
  });

  const user = await ctx.db.query.user.findFirst({
    where: (v, { eq }) => eq(v.telegramId, params.telegramId),
  });
  if (!user) {
    throw new Error(`User not found after creation ${params.telegramId}`);
  }
  return user;
}

export async function updateById(
  ctx: DbCtx,
  userId: string,
  params: Partial<InsertUser>,
) {
  return ctx.db
    .update(schema.user)
    .set({
      ...params,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(schema.user.id, userId));
}

export async function getByTgId(ctx: DbCtx, telegramId: number) {
  if (!telegramId) throw new Error("Missing telegramId");

  return await ctx.db.query.user.findFirst({
    where: (v, { eq }) => eq(v.telegramId, telegramId),
  });
}

export async function getOrCreate(ctx: DbCtx, params: UserCreateParams) {
  const user = await getByTgId(ctx, params.telegramId);
  if (user) return user;

  return await create(ctx, params);
}

function hasUserChanged(user: SelectUser, params: UserCreateParams) {
  function hasChanged(key: keyof UserCreateParams) {
    // If param key is not set, then don't need
    // to check if it has changed.
    if (params[key] === undefined) return false;
    return user[key] !== params[key];
  }

  if (hasChanged("firstName")) return true;
  if (hasChanged("lastName")) return true;
  if (hasChanged("username")) return true;
  if (hasChanged("isRegistered")) return true;
  if (hasChanged("tgIsPremium")) return true;

  // Only need to update the following if not set and has changed.
  if (user.languageCode === null && hasChanged("languageCode")) return true;
  if (user.referrer === null && hasChanged("referrer")) return true;

  return false;
}

type UserOrTelegarmId = { userId: string } | { telegramId: number };

export async function unregister(ctx: DbCtx, params: UserOrTelegarmId) {
  let userId = "";
  if ("userId" in params) {
    userId = params.userId;
  } else {
    const user = await getByTgId(ctx, params.telegramId);
    if (!user) return;
    userId = user.id;
  }

  await ctx.db.batch([
    ctx.db
      .update(schema.user)
      .set({ isRegistered: false, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(schema.user.id, userId)),
    ctx.db.insert(schema.event).values({
      name: "user_unregistered",
      createdById: userId,
    }),
  ]);
}

export async function upsertFromTg(ctx: DbCtx, params: UserCreateParams) {
  const existing = await getByTgId(ctx, params.telegramId);
  if (!existing) {
    const user = await create(ctx, params);
    return { user, isNew: true };
  }

  if (!hasUserChanged(existing, params)) {
    return { user: existing, isNew: false };
  }

  const event: InsertEvent[] = [];
  if (
    params.isRegistered !== undefined &&
    params.isRegistered !== existing.isRegistered
  ) {
    event.push({
      name: params.isRegistered ? "user_registered" : "user_unregistered",
      createdById: existing.id,
    });
  }

  await ctx.db.batch([
    ctx.db
      .update(schema.user)
      .set({
        ...params,
        languageCode: existing.languageCode ?? params.languageCode,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(schema.user.id, existing.id)),
    ...event.map((e) =>
      ctx.db.insert(schema.event).values({
        ...e,
      }),
    ),
  ]);

  return {
    user: {
      ...existing,
      ...params,
      languageCode: existing.languageCode || params.languageCode,
    },
    isNew: false,
  };
}
