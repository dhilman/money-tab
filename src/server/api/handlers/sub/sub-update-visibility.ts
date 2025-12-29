import { z } from "zod";
import { VISIBILITY_VALUES } from "~/lib/consts/constants";
import { privateProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { validator } from "~/server/validator";

const input = z.object({
  id: z.string(),
  visibility: z.enum(VISIBILITY_VALUES).optional(),
});

export const subUpdateVisibilityHandler = privateProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    const sub = await db.query.subscription.findFirst({
      where: ({ id }, { eq }) => eq(id, input.id),
      columns: { createdById: true },
    });
    validator.exists(sub);
    validator.isCreator(ctx, sub.createdById);

    // TODO: Implement this handler
    // await mutate.sub.updateV1({
    //   sub: {
    //     id: input.id,
    //     visibility: input.visibility,
    //   },
    //   contribs: [],
    // });
  });
