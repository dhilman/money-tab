import { z } from "zod";
import { DateStrAsDayJs } from "~/server/api/handlers/zod_schema";
import { privateProcedure } from "~/server/api/trpc";
import { db, mutate } from "~/server/db";
import { dayjsToSqlDate } from "~/server/db/utils";
import { validator } from "~/server/validator";

export const subCancelHandler = privateProcedure
  .input(
    z.object({
      id: z.string(),
      endDate: DateStrAsDayJs,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const sub = await db.query.subscription.findFirst({
      where: ({ id }, { eq }) => eq(id, input.id),
      columns: { createdById: true },
    });

    validator.exists(sub);
    validator.isCreator(ctx, sub.createdById);

    await mutate.sub.cancel(ctx, {
      id: input.id,
      endDate: dayjsToSqlDate(input.endDate),
    });
  });

export const subArchiveHandler = privateProcedure
  .input(z.string())
  .mutation(async ({ ctx, input }) => {
    const sub = await db.query.subscription.findFirst({
      where: ({ id }, { eq }) => eq(id, input),
      columns: { createdById: true },
    });
    validator.exists(sub);
    validator.isCreator(ctx, sub.createdById);

    await mutate.sub.archive({ id: input, callerUserId: ctx.userId });
  });
