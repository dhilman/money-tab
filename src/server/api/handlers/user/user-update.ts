import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { mutate } from "~/server/db";

const input = z.object({
  hideBalance: z.boolean().optional(),
  currencyCode: z.string().length(3).nullish(),
  languageCode: z.string().length(2).nullish(),
  meInPaidFor: z.boolean().optional(),
});

export const userUpdateHandler = privateProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    await mutate.user.updateById(ctx, ctx.userId, input);
    return true;
  });
