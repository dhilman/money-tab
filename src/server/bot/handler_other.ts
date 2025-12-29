import { Composer } from "grammy";
import { env } from "~/env.mjs";
import { URLS } from "~/lib/consts/urls";
import { bot } from "~/server/bot/bot";
import type { Context } from "~/server/bot/context";
import { monitor } from "~/server/monitor/monitor";

const composer = new Composer<Context>();

composer.on("my_chat_member", async (ctx) => {
  const { from, new_chat_member } = ctx.myChatMember;

  if (new_chat_member.user.id !== env.NEXT_PUBLIC_BOT_ID) {
    ctx.logger.info({ new_chat_member }, "Not about this bot");
    return;
  }

  if (
    new_chat_member.status === "member" ||
    new_chat_member.status === "administrator"
  ) {
    monitor.capture({
      error: new Error("Bot added to unsupported chat"),
      properties: {
        chatType: ctx.chat.type,
        chatId: ctx.chat.id,
        fromId: from.id,
      },
    });

    await bot.api
      .sendMessage(
        from.id,
        `Hi there, you have added the bot to a ${ctx.chat.type}.\n
The bot currently only supports private chats & groups.\n
If you have a use case for adding the bot to a ${ctx.chat.type}, please contact ${URLS.TG_SUPPORT}.`
      )
      .catch((err) => {
        ctx.logger.error(
          { error: err as Error },
          "Failed to send unsupported chat message"
        );
      });
  }
});

export default composer;
