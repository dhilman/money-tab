import { z } from "zod";
import { type MyContext, privateProcedure } from "~/server/api/trpc";
import { mutate, queries } from "~/server/db";
import type { SelectTxWithContribs } from "~/server/db/types";
import { notifier } from "~/server/notifier";
import { validator } from "~/server/validator";

export const txArchiveHandler = privateProcedure
  .input(z.string())
  .mutation(async ({ ctx, input }) => {
    validator.id(input);

    const tx = await queries.tx.byId(input, {
      contribs: true,
    });
    validator.isCreator(ctx, tx.createdById);

    await mutate.tx.archive(ctx, tx.id);

    await notify(ctx, tx);

    return true;
  });

const notify = async (ctx: MyContext, tx: SelectTxWithContribs) => {
  const contribs = tx.contribs.filter(
    (c) => c.userId && c.userId !== tx.createdById
  );

  return await notifier.manyByIds(
    ctx,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    contribs.map((c) => c.userId!),
    {
      type: "tx_archived",
      createdBy: ctx.user,
      transactionId: tx.id,
      amount: tx.amount,
      currencyCode: tx.currencyCode,
      description: tx.description,
    }
  );
};
