import { z } from "zod";
import { privateProcedure } from "~/server/api/trpc";
import { mutate } from "~/server/db";

const input = z.object({
  id: z.string(),
  nickname: z.string(),
});

export const userNicknameUpdateHandler = privateProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    await mutate.contact.updateNickname({
      callerUserId: ctx.userId,
      userId: input.id,
      nickname: input.nickname,
    });
    return { id: input.id, nickname: input.nickname };
  });
