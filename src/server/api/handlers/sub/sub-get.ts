import { z } from "zod";
import { calcRenewalDate } from "~/lib/dates/subscription";
import { type MyContext, privateProcedure } from "~/server/api/trpc";
import { mutate, queries } from "~/server/db";
import { SelectUserColumns } from "~/server/db/queries/user";
import type { SelectSubComplete } from "~/server/db/types";
import { validator } from "~/server/validator";

const Input = z.object({
  id: z.string(),
  contribId: z.string().optional(),
});
type Input = z.infer<typeof Input>;

export const subGetHandler = privateProcedure
  .input(Input)
  .query(async ({ input, ctx }) => {
    validator.id(input.id);

    const sub = await queries.sub.byIdLike(ctx, input.id, {
      contribs: {
        with: { user: SelectUserColumns },
      },
    });

    // If user has pending contributions (i.e. unseen), mark them as confirmed
    const userContrib = sub.contribs.find((v) => v.userId === ctx.userId);
    if (userContrib && userContrib.status !== "CONFIRMED") {
      await mutate.sub.contribsConfirm(ctx, sub.id, [ctx.userId]);
      userContrib.status = "CONFIRMED";
    }
    if (!userContrib) {
      await validateAccess(ctx, input, sub);
    }

    return {
      ...sub,
      cycle: { unit: sub.cycleUnit, value: sub.cycleValue },
      joinable: userContrib ? false : true,
      renewalDate: calcRenewalDate({
        startDate: sub.startDate,
        endDate: sub.endDate,
        cycle: { unit: sub.cycleUnit, value: sub.cycleValue },
      })?.format("YYYY-MM-DD"),
    };
  });

async function validateAccess(
  ctx: MyContext,
  input: Input,
  sub: SelectSubComplete,
) {
  const contribId = input.contribId;
  if (contribId) {
    const contrib = sub.contribs.find((c) => c.id.startsWith(contribId));
    if (contrib) return;
  }
  await validator.joinable(ctx, sub);
}
