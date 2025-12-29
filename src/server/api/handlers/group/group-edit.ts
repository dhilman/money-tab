import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { mutate } from "~/server/db";

const input = z.object({
  id: z.string(),
  name: z.string(),
});

export const groupEditHandler = privateProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    const membership = await ctx.db.query.membership.findFirst({
      where: (v, { eq, and }) =>
        and(eq(v.groupId, input.id), eq(v.userId, ctx.userId)),
    });
    if (!membership || membership.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Edit forbidden" });
    }

    await mutate.group.updateById(ctx, input.id, { name: input.name });

    return true;
  });
