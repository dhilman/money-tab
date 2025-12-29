import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { mutate } from "~/server/db";
import { validator } from "~/server/validator";

export const groupJoinHandler = privateProcedure
  .input(z.string())
  .mutation(async ({ ctx, input }) => {
    validator.id(input);

    await mutate.group.upsertMembers(ctx, {
      groupId: input,
      createdById: ctx.userId,
      userIds: [ctx.userId],
    });

    return true;
  });
