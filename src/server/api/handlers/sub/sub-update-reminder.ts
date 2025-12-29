import { z } from "zod";
import { REMINDER_VALUES } from "~/lib/consts/constants";
import { calcReminderDate } from "~/lib/dates/subscription";
import { privateProcedure } from "~/server/api/trpc";
import { mutate, queries } from "~/server/db";
import { dayjsToSqlDateNullable } from "~/server/db/utils";
import { validator } from "~/server/validator";

const input = z.object({
  id: z.string(),
  reminder: z.enum(REMINDER_VALUES).nullable(),
});

export const subUpdateReminderHandler = privateProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    const sub = await queries.sub.byId(input.id, {
      contribs: {
        columns: {
          id: true,
          userId: true,
        },
      },
    });
    const contrib = validator.isParticipant(ctx, sub.contribs);

    const reminderDate = dayjsToSqlDateNullable(
      calcReminderDate(
        {
          startDate: sub.startDate,
          endDate: sub.endDate,
          cycle: { unit: sub.cycleUnit, value: sub.cycleValue },
        },
        input.reminder
      )
    );

    await mutate.sub.updateReminder({
      contribId: contrib.id,
      reminderDate: reminderDate,
      reminder: input.reminder,
    });

    return true;
  });
