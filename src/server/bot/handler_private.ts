import { Composer, type ChatTypeContext } from "grammy";
import { env } from "~/env.mjs";
import type { Context } from "~/server/bot/context";
import { tgUserToUser } from "~/server/bot/tg-utils";
import { mutate } from "~/server/db";
import { queueClient } from "~/server/queue/client";

type Ctx = ChatTypeContext<Context, "private">;
const composer = new Composer<Ctx>();

composer.command("start", async (ctx) => {
  const tguser = ctx.from;
  if (!tguser) return;

  const { isNew } = await mutate.user.upsertFromTg(ctx, {
    ...tgUserToUser(tguser),
    // Match would contain the start parameter (i.e. referrer)
    // e.g. /bot?start=123
    referrer: ctx.match ? ctx.match : undefined,
    isRegistered: true,
  });

  if (isNew) {
    await ctx.replyParsedHTML(ctx.t.startFirst());
    return;
  }

  await ctx.replyParsedHTML(ctx.t.start());
});

composer.command("privacy", async (ctx) => {
  await ctx.replyParsedHTML(ctx.t.privacy());
});

composer.command("welcome", async (ctx) => {
  await ctx.replyParsedHTML(ctx.t.startFirst());
});

composer.on("message:write_access_allowed", async (ctx) => {
  const tgfrom = ctx.from;
  if (!tgfrom) {
    await ctx.replyParsedHTML(ctx.t.start());
    return;
  }

  const { user, isNew } = await mutate.user.upsertFromTg(ctx, {
    ...tgUserToUser(tgfrom),
    isRegistered: true,
  });

  if (!user.photoUrl) {
    await queueClient.avatar({ type: "USER", id: user.id, tgId: tgfrom.id });
  }

  if (isNew) {
    await ctx.replyParsedHTML(ctx.t.startFirst());
    return;
  }

  await ctx.replyParsedHTML(ctx.t.start());
});

composer.on("message", async (ctx) => {
  ctx.logger.info({ message: ctx.message }, "Received generic message");

  await ctx.replyParsedHTML(ctx.t.start());
});

composer.on("my_chat_member", async (ctx) => {
  const { from, chat, new_chat_member } = ctx.myChatMember;
  if (chat.id !== from.id) {
    ctx.logger.warn("Chat ID and from ID do not match");
    return;
  }
  if (new_chat_member.user.id !== env.NEXT_PUBLIC_BOT_ID) {
    ctx.logger.info({ new_chat_member }, "Not about this bot");
    return;
  }

  if (new_chat_member.status === "member") {
    ctx.logger.info("user registered");

    const { user } = await mutate.user.upsertFromTg(ctx, {
      ...tgUserToUser(from),
      isRegistered: true,
    });

    await queueClient.avatar({ type: "USER", id: user.id, tgId: from.id });

    return;
  }

  if (
    new_chat_member.status === "kicked" ||
    new_chat_member.status === "left"
  ) {
    await mutate.user.unregister(ctx, { telegramId: from.id });
    ctx.logger.info("User kicked, unregistered");
    return;
  }

  ctx.logger.info({ new_chat_member }, "new_chat_member unknown status");
});

export default composer;
