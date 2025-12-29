import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { mutate, queries } from "~/server/db";
import { notifier } from "~/server/notifier";
import { joinChangeset } from "~/server/resolver/contribs";
import { validator } from "~/server/validator";

const input = z.object({
  id: z.string(),
  contribId: z.string(),
});

export const subJoinHandler = privateProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    const sub = await queries.sub.byId(input.id, {
      createdBy: true,
      contribs: true,
    });

    await validator.joinable(ctx, sub);

    const changeset = joinChangeset(ctx, {
      contribId: input.contribId,
      contribs: sub.contribs,
      amount: sub.amount,
    });

    await mutate.sub.contribsChangeset(ctx, {
      subId: sub.id,
      changes: changeset,
      subStartDate: sub.startDate,
    });
    await mutate.contact.upsert(ctx, sub.createdById);

    await notifier.notify(sub.createdBy, {
      type: "sub_joined",
      user: ctx.user,
      id: sub.id,
      name: sub.name,
      amount: sub.amount,
      currencyCode: sub.currencyCode,
    });

    return true;
  });
