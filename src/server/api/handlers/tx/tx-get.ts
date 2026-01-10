import { z } from "zod";
import { type MyContext, privateProcedure } from "~/server/api/trpc";
import { mutate, queries } from "~/server/db";
import { SelectUserColumns } from "~/server/db/queries/user";
import type { SelectTxComplete, SelectTxWithContribs } from "~/server/db/types";
import { validator } from "~/server/validator";

const Input = z.object({
  id: z.string(),
  contribId: z.string().optional(),
});
type Input = z.infer<typeof Input>;

export const txGetHandler = privateProcedure
  .input(Input)
  .query(async ({ ctx, input }) => {
    validator.id(input.id);
    if (input.contribId) validator.id(input.contribId);

    const tx = await queries.tx.byIdLike(ctx, input.id, {
      files: true,
      contribs: {
        with: { user: SelectUserColumns },
      },
      events: true,
    });

    const userContrib = tx.contribs.find((c) => c.userId === ctx.user.id);
    if (userContrib && userContrib.status !== "CONFIRMED") {
      await mutate.tx.contribsConfirm(ctx, tx.id, [ctx.user.id]);
      userContrib.status = "CONFIRMED";
    }
    if (!userContrib) {
      await validateAccess(ctx, input, tx);
    }

    return {
      ...tx,
      joinable: userContrib ? false : true,
      isCreator: tx.createdById === ctx.userId,
      isParticipant: userContrib ? true : false,
      status: getTxStatus(tx),
      net: userContrib ? userContrib.amountPaid - userContrib.amountOwed : 0,
    };
  });

async function validateAccess(
  ctx: MyContext,
  input: Input,
  tx: SelectTxWithContribs,
) {
  const contribId = input.contribId;
  if (contribId) {
    const contrib = tx.contribs.find((c) => c.id.startsWith(contribId));
    if (contrib) return;
  }
  await validator.joinable(ctx, tx);
}

export function getTxStatus(
  tx: Pick<SelectTxComplete, "archivedAt" | "contribs">,
) {
  if (tx.archivedAt) {
    return "ARCHIVED" as const;
  }
  const statuses = new Set(tx.contribs.map((c) => c.status));
  if (statuses.has("NOT_DELIVERED")) {
    return "NOT_DELIVERED" as const;
  }
  return "CONFIRMED" as const;
}
