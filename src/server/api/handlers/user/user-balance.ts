import { z } from "zod";
import { DateStrAsDayJs } from "~/server/api/handlers/zod_schema";
import { privateProcedure } from "~/server/api/trpc";
import { queries } from "~/server/db";
import { dayjsToSqlDateNullable } from "~/server/db/utils";

const Input = z.object({
  fromDate: DateStrAsDayJs.nullable(),
});

export const userTxBalanceHandler = privateProcedure
  .input(Input)
  .query(async ({ input, ctx }) => {
    return await queries.tx.balance(ctx, {
      userId: ctx.userId,
      fromDate: dayjsToSqlDateNullable(input.fromDate),
    });
  });
