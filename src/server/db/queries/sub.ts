import { TRPCError } from "@trpc/server";
import { and, eq, exists, isNotNull, isNull, lte, sql } from "drizzle-orm";
import type { ReminderValue } from "~/lib/consts/types";
import { db, schema, type DbCtx } from "~/server/db";
import { prefix } from "~/server/db/utils";

type WithInput = NonNullable<
  Parameters<(typeof db)["query"]["subscription"]["findFirst"]>[0]
>["with"];

type WithInputMany = NonNullable<
  Parameters<(typeof db)["query"]["subscription"]["findMany"]>[0]
>["with"];

export function list<T extends WithInputMany>(
  ctx: DbCtx,
  filters: {
    userId: string;
    archived?: boolean;
  },
  withInput: T
) {
  const { userId, archived = false } = filters;
  return ctx.db.query.subscription.findMany({
    where: (v) =>
      and(
        exists(
          db
            .select()
            .from(schema.subContrib)
            .where(
              and(
                eq(schema.subContrib.subscriptionId, v.id),
                eq(schema.subContrib.userId, userId)
              )
            )
        ),
        isNotNull(schema.subscription.archivedAt).if(archived),
        isNull(schema.subscription.archivedAt).if(!archived)
      ),
    with: withInput,
  });
}

export async function byIdLike<T extends WithInput>(
  ctx: DbCtx,
  id: string,
  withParams: T
) {
  const v = await ctx.db.query.subscription.findFirst({
    where: (v) => prefix(v.id, id),
    with: withParams,
  });
  if (!v) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Subscription not found",
    });
  }
  return v;
}

export async function byId<T extends WithInput>(id: string, withParams: T) {
  const v = await db.query.subscription.findFirst({
    where: ({ id: txId }) => eq(txId, id),
    with: withParams,
  });
  if (!v) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Subscription not found",
    });
  }
  return v;
}

export async function remindCandidates() {
  return db
    .select({
      id: schema.subscription.id,
      contribId: sql<string>`${schema.subContrib.id}`,
      userId: sql<string>`${schema.subContrib.userId}`,
      languageCode: sql<string | null>`${schema.user.languageCode}`,
      timezone: sql<string>`${schema.user.timezone}`,
      telegramId: sql<number>`${schema.user.telegramId}`,
      name: schema.subscription.name,
      amount: schema.subscription.amount,
      currencyCode: schema.subscription.currencyCode,
      reminderDate: sql<string>`${schema.subContrib.reminderDate}`,
      reminder: sql<ReminderValue>`${schema.subContrib.reminder}`,
      cycleUnit: schema.subscription.cycleUnit,
      cycleValue: schema.subscription.cycleValue,
      startDate: schema.subscription.startDate,
      endDate: schema.subscription.endDate,
    })
    .from(schema.subscription)
    .leftJoin(
      schema.subContrib,
      eq(schema.subscription.id, schema.subContrib.subscriptionId)
    )
    .leftJoin(schema.user, eq(schema.subContrib.userId, schema.user.id))
    .where(
      and(
        isNotNull(schema.subContrib.reminder),
        lte(schema.subContrib.reminderDate, sql`DATE()`),
        eq(schema.user.isRegistered, true),
        isNotNull(schema.user.telegramId)
      )
    );
}
