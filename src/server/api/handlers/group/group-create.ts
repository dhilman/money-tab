import { z } from "zod";
import { type MyContext, privateProcedure } from "~/server/api/trpc";
import { mutate } from "~/server/db";
import { notifier } from "~/server/notifier";
import { validator } from "~/server/validator";

const input = z.object({
  name: z.string(),
  colorId: z.number(),
  members: z.array(z.string()),
});
type Input = z.infer<typeof input>;

export const groupCreateHandler = privateProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    await validate(ctx, input);

    const membersSet = new Set(input.members);
    // remove creator from members - always added as admin
    membersSet.delete(ctx.userId);
    const uniqueMembers = Array.from(membersSet);

    const group = await mutate.group.create(ctx, {
      name: input.name,
      accentColorId: input.colorId,
      members: [
        {
          userId: ctx.userId,
          role: "ADMIN",
        },
        ...uniqueMembers.map((userId) => ({
          userId,
          role: "MEMBER" as const,
        })),
      ],
    });

    await notifier.manyByIds(ctx, uniqueMembers, {
      type: "group_created",
      createdBy: ctx.user,
      id: group.id,
      name: input.name,
    });

    return {
      ...group,
      isAdmin: true,
      isMember: true,
      memberIds: uniqueMembers,
    };
  });

const validate = async (ctx: MyContext, input: Input) => {
  await validator.contacts(ctx, input.members);
};
