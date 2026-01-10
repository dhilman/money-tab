import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { mutate, queries } from "~/server/db";
import { notifier } from "~/server/notifier";
import { leaveChangeset } from "~/server/resolver/contribs";
import { validator } from "~/server/validator";

export const subLeaveHandler = privateProcedure
  .input(z.string())
  .mutation(async ({ ctx, input }) => {
    const sub = await queries.sub.byId(input, {
      createdBy: true,
      contribs: true,
    });
    validator.notCreator(
      ctx,
      sub.createdById,
      "Creator cannot leave subscription",
    );

    const changeset = leaveChangeset(ctx, sub);
    await mutate.sub.contribsChangeset(ctx, {
      subId: sub.id,
      changes: changeset,
      subStartDate: sub.startDate,
    });

    await notifier.notify(sub.createdBy, {
      type: "sub_left",
      user: ctx.user,
      id: sub.id,
      name: sub.name,
      amount: sub.amount,
      currencyCode: sub.currencyCode,
    });
  });
