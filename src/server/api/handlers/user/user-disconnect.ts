import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { mutate, queries } from "~/server/db";

export const userDisconnectHandler = privateProcedure
  .input(z.string())
  .mutation(async ({ ctx, input }) => {
    const existing = await queries.user.connectionBetween(
      ctx,
      ctx.userId,
      input
    );
    if (!existing) return { id: input };

    await mutate.contact.remove(ctx, ctx.userId, input);

    return { id: input };
  });
