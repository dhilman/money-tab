import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { SelectUserColumns } from "~/server/db/queries/user";
import { prefix } from "~/server/db/utils";
import { validator } from "~/server/validator";

export const userGetHandler = privateProcedure
  .input(z.string())
  .query(async ({ ctx, input }) => {
    validator.id(input);

    const [user, connection] = await ctx.db.batch([
      ctx.db.query.user.findFirst({
        columns: SelectUserColumns.columns,
        where: (v) => prefix(v.id, input),
      }),
      ctx.db.query.connection.findFirst({
        where: (v, { and, eq }) =>
          and(eq(v.ownerId, ctx.userId), prefix(v.userId, input)),
        columns: { nickname: true },
      }),
    ]);

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return {
      ...user,
      nickname: connection?.nickname ?? null,
      connected: connection ? true : false,
    };
  });
