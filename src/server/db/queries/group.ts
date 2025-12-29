import { eq } from "drizzle-orm";
import { schema } from "~/server/db";
import type { db, DbCtx } from "~/server/db";

type WithInputMany = NonNullable<
  Parameters<(typeof db)["query"]["group"]["findMany"]>[0]
>["with"];

export async function getByTgId(ctx: DbCtx, telegramId: number) {
  if (!telegramId) return null;
  return ctx.db.query.group.findFirst({
    where: (v, { eq }) => eq(v.telegramId, telegramId),
  });
}

export function list<T extends WithInputMany>(
  ctx: DbCtx,
  filters: {
    userId: string;
  },
  withInput: T
) {
  return ctx.db.query.group.findMany({
    where: (v, { and, exists, isNull }) =>
      and(
        exists(
          ctx.db
            .select()
            .from(schema.membership)
            .where(
              and(
                eq(schema.membership.groupId, v.id),
                eq(schema.membership.userId, filters.userId)
              )
            )
        ),
        isNull(v.archivedAt)
      ),
    with: withInput,
  });
}
