import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { mutate } from "~/server/db";

export const userConnectHandler = privateProcedure
  .input(z.string())
  .mutation(async ({ ctx, input }) => {
    if (input === ctx.userId) return true;
    const user = await ctx.db.query.user.findFirst({
      where: (v, { eq }) => eq(v.id, input),
    });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    await mutate.contact.upsert(ctx, user.id);
    // TODO: send notification
    return true;
  });
