import { Composer, type ChatTypeContext } from "grammy";
import { env } from "~/env.mjs";
import type { Context } from "~/server/bot/context";
import { tgUserToUser } from "~/server/bot/tg-utils";
import { mutate, queries } from "~/server/db";
import { queueClient } from "~/server/queue/client";

type Ctx = ChatTypeContext<Context, "group">;
const composer = new Composer<Ctx>();

composer.on("message::bot_command", async (ctx) => {
  const { from, chat } = ctx;
  const user = await mutate.user.getOrCreate(ctx, tgUserToUser(from));
  const group = await mutate.group.getOrCreateByTgId(ctx, {
    telegramId: chat.id,
    name: chat.title,
    creatorId: user.id,
    tgChatType: chat.type,
  });

  await ctx.replyParsedHTML(ctx.t.startGroup(group.groupId));
});

composer.on("message:new_chat_members", async (ctx) => {
  const { new_chat_members } = ctx.message;
  const userMembers = new_chat_members.filter((m) => !m.is_bot);

  const [fromUser, ...users] = await Promise.all([
    mutate.user.getOrCreate(ctx, tgUserToUser(ctx.from)),
    ...userMembers.map((m) => mutate.user.getOrCreate(ctx, tgUserToUser(m))),
  ]);

  const { groupId } = await mutate.group.getOrCreateByTgId(ctx, {
    telegramId: ctx.chat.id,
    name: ctx.chat.title,
    creatorId: fromUser.id,
    tgChatType: ctx.chat.type,
  });

  await mutate.group.upsertMembers(ctx, {
    groupId,
    userIds: [fromUser.id, ...users.map((u) => u.id)],
    createdById: fromUser.id,
  });

  // If the bot is one of new_chat_members, send a welcome message
  if (new_chat_members.some((m) => m.id === env.NEXT_PUBLIC_BOT_ID)) {
    await ctx.replyParsedHTML(ctx.t.startGroupFirst(groupId));
  }
});

composer.on("message:left_chat_member", (ctx) => {
  // TODO: probs want to remove / mark as inactive if user leaves
  // Don't need to handle bot leaving - my_chat_member does that
  ctx.logger.info({ message: ctx.message }, "Received left_chat_member");
  return;
});

composer.on("message:new_chat_photo", async (ctx) => {
  const group = await queries.group.getByTgId(ctx, ctx.chat.id);
  if (!group) return;
  await queueClient.avatar({ type: "GROUP", id: group.id, tgId: ctx.chat.id });
});

composer.on("my_chat_member", async (ctx) => {
  const { chat, from, new_chat_member } = ctx.myChatMember;

  if (new_chat_member.user.id !== env.NEXT_PUBLIC_BOT_ID) {
    ctx.logger.info({ new_chat_member }, "Not about this bot");
    return;
  }

  if (
    new_chat_member.status === "member" ||
    new_chat_member.status === "administrator"
  ) {
    // TODO: what if the user is a bot?
    const { user } = await mutate.user.upsertFromTg(ctx, tgUserToUser(from));
    const { groupId, isNew } = await mutate.group.getOrCreateByTgId(ctx, {
      telegramId: chat.id,
      name: chat.title,
      creatorId: user.id,
      tgChatType: chat.type,
    });
    // If this is an existing group, update to have it linked
    if (!isNew) await mutate.group.linkByTgId(ctx, chat.id);
    await queueClient.avatar(
      { type: "GROUP", id: groupId, tgId: chat.id },
      { retries: 1 }
    );
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
