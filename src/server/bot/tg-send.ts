import { marked } from "marked";
import { env } from "~/env.mjs";
import { bot } from "~/server/bot/bot";
import { isDeactivatedError } from "~/server/bot/bot_errors";
import { Translator } from "~/server/bot/translator";
import { db, mutate } from "~/server/db";
import logger from "~/server/logger";
import { monitor } from "~/server/monitor/monitor";
import type { NotifyDataSingle } from "~/server/notifier/schema";

interface User {
  id: string;
  telegramId: number;
  languageCode: string | null;
}

export const tgNotify = async (user: User, data: NotifyDataSingle) => {
  let html = "";
  try {
    html = await formatAndParse(user, data);
  } catch (err) {
    monitor.capture({
      error: err,
      userId: user.id,
      procedure: "notify.tg",
    });
    return false;
  }

  if (env.NOTIFY_DISABLED) {
    logger.info({ userId: user.id }, "Notify disabled, skipping");
    return true;
  }

  try {
    await bot.api.sendMessage(user.telegramId, html, {
      parse_mode: "HTML",
    });
    monitor.push({ type: "notify", name: data.type, userId: user.id });
    return true;
  } catch (err) {
    if (isDeactivatedError(err)) {
      logger.info({ userId: user.id }, "User deactivated, unregistering");
      await mutate.user.unregister({ db }, { telegramId: user.telegramId });
      return true;
    }
    monitor.capture({
      error: err,
      userId: user.id,
      procedure: "notify.tg",
    });
    return false;
  }
};

async function formatAndParse(user: User, data: NotifyDataSingle) {
  try {
    const reply = format(user, data);
    return await marked.parseInline(reply);
  } catch (err) {
    throw new Error("Failed to format message", { cause: err });
  }
}

const format = (user: User, data: NotifyDataSingle) => {
  const t = new Translator(user.languageCode);
  switch (data.type) {
    case "share_profile":
      return t.shareProfile(data.userId);
    case "share_transaction":
      return t.shareTx(data.transactionId);
    case "tx_created":
      return t.txNew(data);
    case "tx_archived":
      return t.txArchived(data);
    case "tx_joined":
      return t.txJoined(data);
    case "tx_left":
      return t.txLeft(data);
    case "tx_removed_user":
      return t.txRemovedUser(data);
    case "settle_event":
      return t.txSettle(data);
    case "sub_created":
      return t.subNew(data);
    case "subs_reminder":
      return t.subsReminder(data.subs);
    case "sub_joined":
      return t.subJoined(data);
    case "sub_left":
      return t.subLeft(data);
    case "sub_removed_user":
      return t.subRemovedUser(data);
    case "group_created":
      return t.groupCreated(data);
  }
};
