import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { REMINDER_VALUES } from "~/lib/consts/constants";
import { addCycles } from "~/lib/dates/conversions";
import { calcReminderDate } from "~/lib/dates/subscription";
import {
  Contribs,
  Cycle,
  DateStrAsDayJs,
} from "~/server/api/handlers/zod_schema";
import { privateProcedure, type MyContext } from "~/server/api/trpc";
import { mutate } from "~/server/db";
import { type CreateSubParams } from "~/server/db/mutate/sub";
import { dayjsToSqlDate, dayjsToSqlDateNullable } from "~/server/db/utils";
import { notifier } from "~/server/notifier";
import { validator } from "~/server/validator";

const input = z.object({
  name: z.string(),
  groupId: z.string().nullable(),
  value: z.number().int().positive(),
  currencyCode: z.string().length(3),
  // Dates in user's timezone (without time)
  // As want these dates to be exactly what user sees
  // Sub. should renew & end on the dates user sees
  startDate: DateStrAsDayJs,
  endDate: DateStrAsDayJs.nullable(),
  reminder: z.enum(REMINDER_VALUES).nullable(),
  cycle: Cycle,
  trial: Cycle.nullable(),
  contribs: Contribs,
});
type Input = z.infer<typeof input>;

export const subCreateHandler = privateProcedure
  .input(input)
  .mutation(async ({ input, ctx }) => {
    await validate(ctx, input);

    const data = transform(ctx, input);
    await mutate.sub.create(ctx, data);

    const { successes } = await notify(ctx, data);

    await mutate.sub.contribsConfirm(
      ctx,
      data.sub.id,
      successes.map((s) => s.id),
    );

    return data.sub.id;
  });

const validate = async (ctx: MyContext, input: Input) => {
  validator.contribAmounts(input.value, input.contribs);
  validator.contribUserIds(ctx, input.contribs);
  await validator.isGroupMember(ctx, input.groupId);
  // await validator.contactsOrInGroup(ctx, userIds, input.groupId),
};

const transform = (ctx: MyContext, input: Input): CreateSubParams => {
  const subId = createId();

  const startDate = dayjsToSqlDate(
    input.trial ? addCycles(input.startDate, input.trial, 1) : input.startDate,
  );

  const reminderDate = dayjsToSqlDateNullable(
    calcReminderDate(
      {
        startDate,
        endDate: input.endDate,
        cycle: input.cycle,
      },
      input.reminder,
    ),
  );

  const mapContrib = (
    c: Input["contribs"][0],
  ): CreateSubParams["contribs"][0] => {
    const isSelf = c.userId === ctx.userId;
    return {
      id: createId(),
      subscriptionId: subId,
      userId: c.userId,
      amountPaid: c.amountPaid,
      amountOwed: c.amountOwed,
      manualAmountOwed: c.manualAmountOwed,
      joinDate: startDate,
      status: isSelf ? "CONFIRMED" : "NOT_DELIVERED",
      reminder: isSelf ? input.reminder : null,
      reminderDate: isSelf ? reminderDate : null,
    };
  };

  return {
    sub: {
      id: subId,
      createdById: ctx.userId,
      groupId: input.groupId,
      amount: input.value,
      currencyCode: input.currencyCode,
      name: input.name,
      startDate: startDate,
      endDate: dayjsToSqlDateNullable(input.endDate),
      cycleUnit: input.cycle.unit,
      cycleValue: input.cycle.value,
      trialUnit: input.trial?.unit,
      trialValue: input.trial?.value,
      // Make the sub. visible when there are unassigned contributions
      visibility: input.contribs.some((c) => c.userId === null)
        ? "RESTRICTED"
        : "PRIVATE",
    },
    contribs: input.contribs.map(mapContrib),
  };
};

const notify = async (ctx: MyContext, params: CreateSubParams) => {
  const contribs = params.contribs.filter(
    (c) => c.userId && c.userId !== ctx.userId,
  );
  return await notifier.manyByIdsSync(
    ctx,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    contribs.map((c) => c.userId!),
    {
      type: "sub_created" as const,
      createdBy: ctx.user,
      id: params.sub.id,
      name: params.sub.name,
      amount: params.sub.amount,
      currencyCode: params.sub.currencyCode ?? "USD",
    },
  );
};
