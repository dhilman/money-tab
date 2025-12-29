import { userTxBalanceHandler } from "~/server/api/handlers/user/user-balance";
import { userConnectHandler } from "~/server/api/handlers/user/user-connect";
import { userDisconnectHandler } from "~/server/api/handlers/user/user-disconnect";
import { userGetHandler } from "~/server/api/handlers/user/user-get";
import { userNicknameUpdateHandler } from "~/server/api/handlers/user/user-nickname-update";
import { userStartHandler } from "~/server/api/handlers/user/user-start";
import { userUpdateHandler } from "~/server/api/handlers/user/user-update";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { notifier } from "~/server/notifier";

export const userRouter = createTRPCRouter({
  start: userStartHandler,
  balance: userTxBalanceHandler,
  update: userUpdateHandler,
  updateNickname: userNicknameUpdateHandler,
  get: userGetHandler,
  connect: userConnectHandler,
  disconnect: userDisconnectHandler,
  share: privateProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user.telegramId) {
      throw new Error("User has no telegramId");
    }
    await notifier.notifySync(ctx.user, {
      type: "share_profile",
      userId: ctx.userId,
    });
  }),
});
