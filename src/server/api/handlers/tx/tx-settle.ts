import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { type MyContext, privateProcedure } from "~/server/api/trpc";
import { mutate } from "~/server/db";
import { type CreateTxParams } from "~/server/db/mutate/tx";
import { notifier } from "~/server/notifier";
import { validator } from "~/server/validator";

const input = z.object({
  userId: z.string(),
  amount: z.number().int(),
  currencyCode: z.string().length(3),
});
type Input = z.infer<typeof input>;

export const txSettleHandler = privateProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    await validate(ctx, input);

    const data = transform(ctx, input);

    await mutate.tx.createV1(ctx, data);

    const notified = await notifier.singleByIdSync(ctx, input.userId, {
      type: "settle_event",
      createdBy: ctx.user,
      transactionId: data.tx.id,
      amount: data.tx.amount,
      currencyCode: data.tx.currencyCode || "USD",
    });

    if (notified) {
      await mutate.tx.contribsConfirm(ctx, data.tx.id, [input.userId]);
    }

    return data.tx.id;
  });

const validate = async (ctx: MyContext, input: Input) => {
  await validator.contactOrShareGroup(ctx, input.userId);
};

const transform = (ctx: MyContext, input: Input): CreateTxParams => {
  const txId = createId();
  const posAmount = Math.abs(input.amount);

  let contribs = [] as CreateTxParams["contribs"];

  if (input.amount > 0) {
    contribs = [
      {
        id: createId(),
        transactionId: txId,
        userId: ctx.userId,
        amountPaid: 0,
        amountOwed: posAmount,
        status: "CONFIRMED",
      },
      {
        id: createId(),
        transactionId: txId,
        userId: input.userId,
        amountPaid: posAmount,
        amountOwed: 0,
        status: "NOT_DELIVERED",
      },
    ];
  } else {
    contribs = [
      {
        id: createId(),
        transactionId: txId,
        userId: ctx.userId,
        amountPaid: posAmount,
        amountOwed: 0,
        status: "CONFIRMED",
      },
      {
        id: createId(),
        transactionId: txId,
        userId: input.userId,
        amountPaid: 0,
        amountOwed: posAmount,
        status: "NOT_DELIVERED",
      },
    ];
  }

  return {
    tx: {
      id: txId,
      createdById: ctx.userId,
      amount: posAmount,
      currencyCode: input.currencyCode,
      type: "SETTLE",
      groupId: null,
    },
    contribs,
    files: [],
  };
};
