import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { mutate, queries } from "~/server/db";
import { notifier } from "~/server/notifier";
import { joinChangeset } from "~/server/resolver/contribs";
import { validator } from "~/server/validator";

const input = z.object({
  id: z.string(),
  contribId: z.string(),
});

export const txJoinHandler = privateProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    const tx = await queries.tx.byId(input.id, {
      contribs: true,
    });
    await validator.joinable(ctx, tx);

    const changeset = joinChangeset(ctx, {
      contribId: input.contribId,
      contribs: tx.contribs,
      amount: tx.amount,
    });
    await mutate.tx.contribsChangeset(ctx, tx.id, changeset);
    await mutate.contact.upsert(ctx, tx.createdById);

    await notifier.singleById(ctx, tx.createdById, {
      type: "tx_joined",
      transactionId: tx.id,
      amount: tx.amount,
      currencyCode: tx.currencyCode,
      description: tx.description,
      user: ctx.user,
    });

    return true;
  });
