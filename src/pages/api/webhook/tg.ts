import { webhookCallback } from "grammy";
import { env } from "~/env.mjs";
import { bot } from "~/server/bot/bot";

export default webhookCallback(bot, "next-js", {
  secretToken: env.WEBHOOK_SECRET,
});
