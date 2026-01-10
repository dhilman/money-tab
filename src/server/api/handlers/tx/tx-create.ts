import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import {
  Contribs,
  DateOrDateTimeStrAsSql,
  Files,
} from "~/server/api/handlers/zod_schema";
import { privateProcedure, type MyContext } from "~/server/api/trpc";
import { mutate } from "~/server/db";
import type { CreateTxParams } from "~/server/db/mutate/tx";
import { notifier } from "~/server/notifier";
import { validator } from "~/server/validator";

const input = z.object({
  value: z.number().int().positive(),
  currencyCode: z.string().length(3),
  description: z.string(),
  date: DateOrDateTimeStrAsSql.nullable(),
  files: Files,
  contributions: Contribs,
  groupId: z.string().nullable(),
});
type Input = z.infer<typeof input>;

export const txCreatehandler = privateProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    await validate(ctx, input);

    const data = transform(ctx, input);
    await mutate.tx.createV1(ctx, data);

    const { successes } = await notify(ctx, data);
    await mutate.tx.contribsConfirm(
      ctx,
      data.tx.id,
      successes.map((s) => s.id),
    );

    return data.tx.id;
  });

const validate = async (ctx: MyContext, input: Input) => {
  validator.contribAmounts(input.value, input.contributions);
  validator.contribUserIds(ctx, input.contributions);
  await validator.isGroupMember(ctx, input.groupId);
  // await validator.contactsOrInGroup(ctx, userIds, input.groupId)
};

const transform = (ctx: MyContext, input: Input): CreateTxParams => {
  const txId = createId();

  function mapContrib(
    contrib: Input["contributions"][0],
  ): CreateTxParams["contribs"][0] {
    return {
      id: createId(),
      transactionId: txId,
      userId: contrib.userId,
      amountPaid: contrib.amountPaid,
      amountOwed: contrib.amountOwed,
      manualAmountOwed: contrib.manualAmountOwed,
      status: contrib.userId === ctx.userId ? "CONFIRMED" : "NOT_DELIVERED",
    };
  }

  return {
    tx: {
      id: txId,
      createdById: ctx.userId,
      amount: input.value,
      currencyCode: input.currencyCode,
      description: input.description,
      date: input.date,
      groupId: input.groupId,
      type: "PAYMENT",
      visibility: "RESTRICTED",
    },
    contribs: input.contributions.map(mapContrib),
    files: input.files.map((a) => ({
      id: createId(),
      transactionId: txId,
      createdBy: ctx.userId,
      url: a.url,
      size: a.size,
      type: a.type,
    })),
  };
};

const notify = async (ctx: MyContext, data: CreateTxParams) => {
  const contribs = data.contribs.filter(
    (c) => c.userId !== ctx.userId && c.userId,
  );

  return await notifier.manyByIdsSync(
    ctx,
    contribs.map((c) => c.userId!),
    {
      type: "tx_created",
      createdBy: ctx.user,
      transactionId: data.tx.id,
      amount: data.tx.amount,
      currencyCode: data.tx.currencyCode ?? "USD",
      description: data.tx.description ?? "",
    },
  );
};
