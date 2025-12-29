import { type ChatTypeContext, Composer } from "grammy";
import { env } from "~/env.mjs";
import { isKickedFromGroupError } from "~/server/bot/bot_errors";
import { type Context } from "~/server/bot/context";
import { tgUserToUser } from "~/server/bot/tg-utils";
import { mutate } from "~/server/db";

type Ctx = ChatTypeContext<Context, "supergroup">;
const composer = new Composer<Ctx>();

composer.on("message::bot_command", async (ctx) => {
  ctx.logger.info("bot_command supergroup");
  const { from, chat } = ctx;
  const user = await mutate.user.getOrCreate(ctx, tgUserToUser(from));
  const group = await mutate.group.getOrCreateByTgId(ctx, {
    telegramId: chat.id,
    name: chat.title,
    creatorId: user.id,
    tgChatType: chat.type,
  });

  await ctx
    .replyParsedHTML(ctx.t.startSupergroup(group.groupId))
    .catch((err) => {
      if (isKickedFromGroupError(err)) {
        ctx.logger.info("Bot was kicked from supergroup");
        return;
      }
      throw err;
    });
});

composer.on("my_chat_member", async (ctx) => {
  ctx.logger.info("my_chat_member supergroup");
  const { chat, from, new_chat_member } = ctx.myChatMember;

  if (new_chat_member.user.id !== env.NEXT_PUBLIC_BOT_ID) {
    ctx.logger.info({ new_chat_member }, "Not about this bot");
    return;
  }

  if (
    new_chat_member.status === "member" ||
    new_chat_member.status === "administrator"
  ) {
    const { user } = await mutate.user.upsertFromTg(ctx, tgUserToUser(from));
    const { groupId, isNew } = await mutate.group.getOrCreateByTgId(ctx, {
      telegramId: chat.id,
      name: chat.title,
      creatorId: user.id,
      tgChatType: chat.type,
    });
    if (!isNew) await mutate.group.linkByTgId(ctx, chat.id);
    // await queueClient.avatar({ type: "GROUP", id: groupId, tgId: chat.id });

    await ctx.replyParsedHTML(ctx.t.startSupergroup(groupId)).catch((err) => {
      if (isKickedFromGroupError(err)) {
        ctx.logger.info("Bot was kicked from supergroup");
        return;
      }
      throw err;
    });
    return;
  }

  if (
    new_chat_member.status === "left" ||
    new_chat_member.status === "kicked"
  ) {
    await mutate.group.unlinkByTgId(ctx, chat.id);
    return;
  }
});

export default composer;
