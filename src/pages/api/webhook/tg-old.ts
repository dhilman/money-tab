import { fmt, hydrateReply, type ParseModeFlavor } from "@grammyjs/parse-mode";
import { Bot, webhookCallback, type Context } from "grammy";
import { env } from "~/env.mjs";

type MyContext = ParseModeFlavor<Context>;
const bot = new Bot<MyContext>(env.BOT_TOKEN_OLD);
bot.botInfo = {
  id: 1418109735,
  username: "MoneyLendingBot",
  first_name: "MoneyLendingBot",
  is_bot: true,
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
};

bot.use(hydrateReply);

bot.on("message", async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  const reply = fmt`Hi there, this bot has moved to @${env.NEXT_PUBLIC_BOT_USERNAME}.`;
  await ctx.replyFmt(reply);
});

export default webhookCallback(bot, "next-js", {
  secretToken: env.WEBHOOK_SECRET,
});
