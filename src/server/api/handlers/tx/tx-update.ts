import { z } from "zod";
import { type MyContext, privateProcedure } from "~/server/api/trpc";
import { mutate, queries } from "~/server/db";
import type { UpdateTxParams } from "~/server/db/mutate/tx";
import type {
  InsertFile,
  SelectTxComplete,
  SelectTxWithContribs,
} from "~/server/db/types";
import { notifier } from "~/server/notifier";
import { type NotifyEventById } from "~/server/notifier/notifier";
import { type NotifyDataSingle } from "~/server/notifier/schema";
import { resolveArrayChanges } from "~/server/resolver/array-resolver";
import { resolveTxChanges, type TxChangeset } from "~/server/resolver/contribs";
import { validator } from "~/server/validator";
import { Contribs, DateOrDateTimeStrAsSql, Files } from "../zod_schema";

const Input = z.object({
  id: z.string(),
  amount: z.number().int(),
  currencyCode: z.string().length(3),
  description: z.string(),
  groupId: z.string().nullable(),
  date: DateOrDateTimeStrAsSql.nullable(),
  contribs: Contribs,
  files: Files,
});
type Input = z.infer<typeof Input>;

export const txUpdateHandler = privateProcedure
  .input(Input)
  .mutation(async ({ ctx, input }) => {
    const tx = await queries.tx.byId(input.id, {
      contribs: true,
      files: true,
    });
    validate(ctx, input, tx);

    const data = transform(ctx, input, tx);
    await mutate.tx.update(ctx, input.id, data);

    const { successes } = await notify(ctx, data.contribs.events, tx);
    await mutate.tx.contribsConfirm(
      ctx,
      tx.id,
      successes.map((s) => s.id)
    );

    return tx.id;
  });

function validate(ctx: MyContext, input: Input, tx: SelectTxWithContribs) {
  validator.isCreator(ctx, tx.createdById);
  validator.contribAmounts(input.amount, input.contribs);
  validator.contribUserIds(ctx, input.contribs);
  // await validator.contactsOrInGroup(ctx, userIds, tx.groupId);
}

type TxSelected = Omit<SelectTxComplete, "createdBy">;

function transform(
  ctx: MyContext,
  input: Input,
  tx: TxSelected
): UpdateTxParams {
  function isChanged() {
    return (
      input.amount !== tx.amount ||
      input.currencyCode !== tx.currencyCode ||
      input.description !== tx.description ||
      input.date !== tx.date ||
      input.groupId !== tx.groupId
    );
  }

  const inputFiles: InsertFile[] = input.files.map((f) => ({
    id: f.id,
    transactionId: tx.id,
    createdBy: ctx.userId,
    url: f.url,
    size: f.size,
    type: f.type,
  }));

  return {
    tx: {
      amount: input.amount,
      currencyCode: input.currencyCode,
      description: input.description,
      date: input.date,
      groupId: input.groupId,
    },
    contribs: resolveTxChanges({ old: tx.contribs, new: input.contribs }),
    files: resolveArrayChanges({ old: tx.files, new: inputFiles }),
    isChanged: isChanged(),
  };
}

async function notify(
  ctx: MyContext,
  events: TxChangeset["events"],
  tx: SelectTxWithContribs
) {
  const userIds = events.map((e) => e.userId);
  const notifs = [] as NotifyEventById[];
  for (const userId of userIds) {
    const data = changesetToNotifyData(ctx, { tx, userId, events });
    if (!data) continue;
    notifs.push({ userId, data });
  }

  return await notifier.batchByIdsSync(ctx, notifs);
}

function changesetToNotifyData(
  ctx: MyContext,
  params: {
    tx: SelectTxWithContribs;
    userId: string;
    events: TxChangeset["events"];
  }
): NotifyDataSingle | null {
  if (params.userId === ctx.userId) return null;

  const events = params.events.filter((e) => e.userId === params.userId);
  if (events.length === 0) return null;
  if (events.some((e) => e.newUser)) {
    return {
      type: "tx_created",
      createdBy: ctx.user,
      transactionId: params.tx.id,
      amount: params.tx.amount,
      currencyCode: params.tx.currencyCode,
      description: params.tx.description,
    };
  }
  if (events.some((e) => e.type === "leave")) {
    return {
      type: "tx_removed_user",
      createdBy: ctx.user,
      transactionId: params.tx.id,
      amount: params.tx.amount,
      currencyCode: params.tx.currencyCode,
      description: params.tx.description,
    };
  }
  return null;
}
