import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { SelectUserColumns } from "~/server/db/queries/user";
import { prefix } from "~/server/db/utils";
import { validator } from "~/server/validator";

export const groupGetHandler = privateProcedure
  .input(z.string())
  .query(async ({ ctx, input }) => {
    validator.id(input);

    const group = await ctx.db.query.group.findFirst({
      where: (v) => prefix(v.id, input),
      with: {
        memberships: {
          with: {
            user: SelectUserColumns,
          },
        },
      },
    });
    validator.exists(group);

    const membership = group.memberships.find((m) => m.userId === ctx.userId);

    return {
      ...group,
      isAdmin: membership?.role === "ADMIN",
      isMember: membership !== undefined,
    };
  });
