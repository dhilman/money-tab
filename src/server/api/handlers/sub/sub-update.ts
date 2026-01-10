import { z } from "zod";
import { addCycles } from "~/lib/dates/conversions";
import { calcReminderDate } from "~/lib/dates/subscription";
import {
  Contribs,
  Cycle,
  DateStrAsDayJs,
} from "~/server/api/handlers/zod_schema";
import { type MyContext, privateProcedure } from "~/server/api/trpc";
import { mutate, queries } from "~/server/db";
import type { UpdateSubParams } from "~/server/db/mutate/sub";
import { type SelectSubComplete } from "~/server/db/types";
import { dayjsToSqlDate, dayjsToSqlDateNullable } from "~/server/db/utils";
import { notifier } from "~/server/notifier";
import { type NotifyEventById } from "~/server/notifier/notifier";
import { type NotifyDataSingle } from "~/server/notifier/schema";
import {
  resolveSubChanges,
  type SubChangeset,
} from "~/server/resolver/contribs";
import { validator } from "~/server/validator";

const Input = z.object({
  id: z.string(),
  name: z.string(),
  groupId: z.string().nullable(),
  amount: z.number().int(),
  currencyCode: z.string().length(3),
  startDate: DateStrAsDayJs,
  endDate: DateStrAsDayJs.nullable(),
  cycle: Cycle,
  trial: Cycle.nullable(),
  contribs: Contribs,
});
type Input = z.infer<typeof Input>;

export const subUpdateHandler = privateProcedure
  .input(Input)
  .mutation(async ({ input, ctx }) => {
    const sub = await queries.sub.byId(input.id, {
      contribs: true,
    });

    validate(ctx, input, sub);

    const data = transform(ctx, input, sub);

    await mutate.sub.update(ctx, sub.id, data);

    const { successes } = await notify(ctx, data.contribs.events, sub);
    await mutate.sub.contribsConfirm(
      ctx,
      sub.id,
      successes.map((s) => s.id),
    );

    return data.sub.id;
  });

function validate(ctx: MyContext, input: Input, sub: SelectSubComplete) {
  validator.isCreator(ctx, sub.createdById);
  validator.contribAmounts(input.amount, input.contribs);
  validator.contribUserIds(ctx, input.contribs);

  // await validator.contactsOrInGroup(ctx, userIds, sub.groupId);
}

function transform(
  ctx: MyContext,
  input: Input,
  sub: SelectSubComplete,
): UpdateSubParams {
  const startDate = dayjsToSqlDate(
    input.trial ? addCycles(input.startDate, input.trial, 1) : input.startDate,
  );

  function isChanged() {
    return (
      input.amount !== sub.amount ||
      input.currencyCode !== sub.currencyCode ||
      input.name !== sub.name ||
      input.groupId !== sub.groupId ||
      startDate !== sub.startDate ||
      input.endDate !== sub.endDate ||
      input.cycle.unit !== sub.cycleUnit ||
      input.cycle.value !== sub.cycleValue ||
      input.trial?.unit !== sub.trialUnit ||
      input.trial?.value !== sub.trialValue
    );
  }

  const changeset = resolveSubChanges({
    old: sub.contribs,
    new: input.contribs,
    // FIX?: there might be a chance that for some of the contributors
    // the cycle will exceed their reminder (lead time).
    // this is currently not validated
    getReminderDate: (c) => {
      return dayjsToSqlDateNullable(
        calcReminderDate(
          { startDate: startDate, cycle: input.cycle, endDate: input.endDate },
          c.reminder,
        ),
      );
    },
  });

  return {
    sub: {
      id: input.id,
      name: input.name,
      groupId: input.groupId,
      amount: input.amount,
      currencyCode: input.currencyCode,
      startDate,
      endDate: dayjsToSqlDateNullable(input.endDate),
      cycleUnit: input.cycle.unit,
      cycleValue: input.cycle.value,
      trialUnit: input.trial?.unit,
      trialValue: input.trial?.value,
    },
    contribs: changeset,
    isChanged: isChanged(),
  };
}

async function notify(
  ctx: MyContext,
  events: SubChangeset["events"],
  sub: SelectSubComplete,
) {
  const userIds = events.map((e) => e.userId);
  const notifs = [] as NotifyEventById[];
  for (const userId of userIds) {
    const data = changesetToNotifyData(ctx, { sub, userId, events });
    if (!data) continue;
    notifs.push({ userId, data });
  }

  return await notifier.batchByIdsSync(ctx, notifs);
}

function changesetToNotifyData(
  ctx: MyContext,
  params: {
    sub: SelectSubComplete;
    userId: string;
    events: SubChangeset["events"];
  },
): NotifyDataSingle | null {
  if (params.userId === ctx.userId) return null;

  const events = params.events.filter((e) => e.userId === params.userId);
  if (events.length === 0) return null;
  if (events.some((e) => e.newUser)) {
    return {
      type: "sub_created",
      createdBy: ctx.user,
      id: params.sub.id,
      name: params.sub.name,
      amount: params.sub.amount,
      currencyCode: params.sub.currencyCode,
    };
  }
  if (events.some((e) => e.type === "leave")) {
    return {
      type: "sub_removed_user",
      createdBy: ctx.user,
      id: params.sub.id,
      amount: params.sub.amount,
      currencyCode: params.sub.currencyCode,
      name: params.sub.name,
    };
  }
  return null;
}
