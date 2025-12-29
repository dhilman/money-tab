import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { mutate, queries } from "~/server/db";
import { notifier } from "~/server/notifier";
import { leaveChangeset } from "~/server/resolver/contribs";
import { validator } from "~/server/validator";

export const txLeaveHandler = privateProcedure
  .input(z.string())
  .mutation(async ({ ctx, input }) => {
    const tx = await queries.tx.byId(input, {
      contribs: true,
    });
    validator.notCreator(
      ctx,
      tx.createdById,
      "Creator cannot leave transaction"
    );

    const changeset = leaveChangeset(ctx, tx);
    await mutate.tx.contribsChangeset(ctx, tx.id, changeset);

    await notifier.singleById(ctx, tx.createdById, {
      type: "tx_left",
      transactionId: tx.id,
      amount: tx.amount,
      currencyCode: tx.currencyCode,
      description: tx.description,
      user: ctx.user,
    });

    return true;
  });
