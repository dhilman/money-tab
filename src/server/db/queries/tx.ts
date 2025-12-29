import { TRPCError } from "@trpc/server";
import {
  and,
  eq,
  exists,
  gt,
  inArray,
  isNotNull,
  isNull,
  ne,
  not,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db, schema, type DbCtx } from "~/server/db";
import { prefix } from "~/server/db/utils";

type WithInput = NonNullable<
  Parameters<(typeof db)["query"]["transaction"]["findFirst"]>[0]
>["with"];

type WithInputMany = NonNullable<
  Parameters<(typeof db)["query"]["transaction"]["findMany"]>[0]
>["with"];

const txIdsBetweenUsers = (userIds: string[]) => {
  return db
    .select({
      id: schema.contribution.transactionId,
    })
    .from(schema.contribution)
    .where(inArray(schema.contribution.userId, userIds))
    .groupBy(({ id }) => id)
    .having(
      eq(sql`count(DISTINCT ${schema.contribution.userId})`, userIds.length)
    );
};

export function list<T extends WithInputMany>(
  ctx: DbCtx,
  filters: {
    userId?: string;
    userIds?: string[];
    groupId?: string;
    archived?: boolean;
    limit?: number;
  },
  withInput: T
) {
  const {
    userId = "",
    userIds = [],
    groupId = "",
    archived = false,
    limit = 10,
  } = filters;
  return ctx.db.query.transaction.findMany({
    where: ({ id }) =>
      and(
        exists(
          db
            .select()
            .from(schema.contribution)
            .where(
              and(
                eq(schema.contribution.transactionId, id),
                eq(schema.contribution.userId, userId)
              )
            )
        ).if(userId !== ""),
        isNotNull(schema.transaction.archivedAt).if(archived),
        isNull(schema.transaction.archivedAt).if(!archived),
        eq(schema.transaction.groupId, groupId).if(groupId),
        ...(userIds.length > 0 ? [inArray(id, txIdsBetweenUsers(userIds))] : [])
      ),
    with: withInput,
    orderBy: (cols, { desc }) => [desc(cols.createdAt)],
    limit: limit,
  });
}

interface BalanceParams {
  userId: string;
  fromDate: string | null;
}

export function balance(ctx: DbCtx, params: BalanceParams) {
  const c1 = alias(schema.contribution, "c1");
  const c2 = alias(schema.contribution, "c2");

  return ctx.db
    .select({
      userId: sql<string>`${c2.userId}`,
      currencyCode: sql<string>`${schema.transaction.currencyCode}`,
      amount: sql`SUM(
          CASE WHEN ${c1.amountPaid} > 0 THEN ${c2.amountOwed} ELSE -${c1.amountOwed} END
        )`.mapWith(Number),
    })
    .from(c1)
    .leftJoin(c2, eq(c1.transactionId, c2.transactionId))
    .leftJoin(schema.transaction, eq(c1.transactionId, schema.transaction.id))
    .where(
      and(
        eq(c1.userId, params.userId),
        ne(c2.userId, params.userId),
        not(isNull(c2.userId)),
        isNull(schema.transaction.archivedAt),
        or(
          and(gt(c1.amountPaid, 0), gt(c2.amountOwed, 0)),
          and(gt(c1.amountOwed, 0), gt(c2.amountPaid, 0))
        ),
        gt(schema.transaction.createdAt, params.fromDate!).if(params.fromDate)
      )
    )
    .groupBy(c2.userId, schema.transaction.currencyCode);
}

export async function byIdLike<T extends WithInput>(
  ctx: DbCtx,
  id: string,
  withParams: T
) {
  const tx = await ctx.db.query.transaction.findFirst({
    where: (v) => prefix(v.id, id),
    with: withParams,
  });
  if (!tx) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Transaction not found",
    });
  }
  return tx;
}

export async function byId<T extends WithInput>(id: string, withParams: T) {
  const tx = await db.query.transaction.findFirst({
    where: ({ id: txId }) => eq(txId, id),
    with: withParams,
  });
  if (!tx) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Transaction not found",
    });
  }
  return tx;
}
