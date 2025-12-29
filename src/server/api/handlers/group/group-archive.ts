import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { mutate } from "~/server/db";

export const groupArchiveHandler = privateProcedure
  .input(z.string())
  .mutation(async ({ ctx, input }) => {
    const membership = await ctx.db.query.membership.findFirst({
      where: (v, { eq, and }) =>
        and(eq(v.groupId, input), eq(v.userId, ctx.userId)),
    });
    if (!membership || membership.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Edit forbidden" });
    }

    const group = await ctx.db.query.group.findFirst({
      where: (v, { eq }) => eq(v.id, input),
    });
    if (group?.archivedAt) return { id: input };

    await mutate.group.archive(ctx, input);

    return { id: input };
  });
