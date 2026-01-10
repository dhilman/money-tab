import { Bot } from "grammy";
import { env } from "~/env.mjs";
import logger from "~/server/logger";
import { hydrateReply } from "@grammyjs/parse-mode";
import { type Context } from "~/server/bot/context";
import handler_inline from "~/server/bot/handler_inline";
import handler_private from "~/server/bot/handler_private";
import handler_group from "~/server/bot/handler_group";
import handler_supergroup from "~/server/bot/handler_supergroup";
import handler_other from "~/server/bot/handler_other";
import { Translator } from "~/server/bot/translator";
import { monitor } from "~/server/monitor/monitor";
import { db } from "~/server/db";
import { marked } from "marked";

export const bot = new Bot<Context>(env.BOT_TOKEN, {
  botInfo: {
    id: env.NEXT_PUBLIC_BOT_ID,
    username: env.NEXT_PUBLIC_BOT_USERNAME,
    first_name: env.NEXT_PUBLIC_BOT_NAME,
    is_bot: true,
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: true,
    can_connect_to_business: false,
    has_main_web_app: false,
  },
});

bot.use(hydrateReply);

// logging
bot.use(async (ctx, next) => {
  const updateTypes = Object.keys(ctx.update)
    .filter((v) => v !== "update_id")
    .join(", ");
  ctx.logger = logger.child({
    update_id: ctx.update.update_id,
    update_type: updateTypes,
    user_id: ctx.from?.id,
    chat_id: ctx.chat?.id,
  });
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.logger.info({ latencyMs: ms }, "Processed update");
});

// Context properties
bot.use(async (ctx, next) => {
  ctx.t = new Translator(ctx.from?.language_code || "en");
  ctx.db = db;
  ctx.replyParsedHTML = async (text) => {
    const reply = await marked.parseInline(text);
    await ctx.reply(reply, { parse_mode: "HTML" });
  };
  await next();
});

// error handling / monitoring
bot.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    monitor.capture({
      error: err,
      path: "/webhook/tg",
      properties: ctx.update,
    });
  }
  await monitor.flush();
});

// Ignore updates from bots
bot.use(async (ctx, next) => {
  if (ctx.from?.is_bot) return;
  await next();
});

bot.chatType("private").use(handler_private);
bot.chatType("group").use(handler_group);

bot.chatType("supergroup").use(handler_supergroup);
bot.chatType("channel").use(handler_other);

bot.use(handler_inline);
