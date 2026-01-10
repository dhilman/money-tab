import { createId } from "@paralleldrive/cuid2";
import { Composer, type Filter } from "grammy";
import { z } from "zod";
import { env } from "~/env.mjs";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import { splitAmount } from "~/lib/amount/split-amount";
import { URLS } from "~/lib/consts/urls";
import { type Context } from "~/server/bot/context";
import { db } from "~/server/db";

const composer = new Composer<Context>();

class InlineQuery {
  description: string;
  amount: number;

  constructor(public query: string) {
    this.query = query;
    this.description = "";
    this.amount = 0;
  }

  parse() {
    return this.parseAndRemoveFloat();
  }

  private parseAndRemoveFloat(): boolean {
    const re = /(\d+)([.,]\d+)?/;
    const match = this.query.match(re);
    if (!match) return false;

    let amountStr = match[0];
    if (!amountStr) return false;

    amountStr = amountStr.replace(",", "");
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return false;

    this.description = this.query.replace(re, "").trim();
    this.amount = Math.round(amount * 100);
    return true;
  }
}

const SplitTypes = ["LEND_SPLIT", "LEND", "BORROW", "BORROW_SPLIT"] as const;
const QueryIdSchema = z.object({
  txid: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
  type: z.enum(SplitTypes),
  description: z.string(),
});
export type QueryId = z.infer<typeof QueryIdSchema>;

const QUERY_ID_TYPE_MAP: Record<QueryId["type"], string> = {
  LEND: "L",
  LEND_SPLIT: "LS",
  BORROW: "B",
  BORROW_SPLIT: "BS",
};

const encodeQueryId = (params: QueryId) => {
  const { txid, amount, type, currencyCode, description } = params;
  return `${txid}:${amount}:${currencyCode}:${QUERY_ID_TYPE_MAP[type]}:${description}`;
};

export const decodeQueryId = (queryId: string): QueryId | null => {
  const [txid, amount, currency, type, ...rest] = queryId.split(":");
  const description = rest.join(":");
  if (!txid || !amount || !currency || !type) return null;

  const t = Object.entries(QUERY_ID_TYPE_MAP).find(
    ([_k, v]) => v === type,
  )?.[0];
  if (!t) return null;

  return {
    txid,
    amount: parseInt(amount),
    currencyCode: currency,
    type: t as QueryId["type"],
    description,
  };
};

class InlineReplier {
  constructor(private ctx: Filter<Context, "inline_query">) {}

  button(text = "Open App") {
    return {
      text,
      web_app: { url: URLS.BOT_WEB_APP },
    };
  }

  async app() {
    await this.ctx.answerInlineQuery([], {
      button: this.button(),
      is_personal: false,
    });
  }

  async shareApp() {
    await this.ctx.answerInlineQuery([
      {
        id: Math.random().toString(),
        type: "article",
        title: "Share",
        description: "Share a transaction",
        input_message_content: {
          message_text: "the link should be here",
        },
      },
    ]);
  }

  private txTitle(type: (typeof SplitTypes)[number]) {
    switch (type) {
      case "LEND":
        return "I paid, not split";
      case "LEND_SPLIT":
        return "I paid, split";
      case "BORROW":
        return "I borrowed, not split";
      case "BORROW_SPLIT":
        return "I borrowed, split";
    }
  }

  async transaction(query: string) {
    const parsed = new InlineQuery(query);
    if (!parsed.parse()) {
      await this.shareApp();
      return;
    }

    const txId = createId();
    const currency = "USD";
    let description = formatAmountCurrency(parsed.amount, currency, {
      withSign: false,
      withSymbol: true,
    });
    if (parsed.description) {
      description += ` for ${parsed.description}`;
    }

    const replies = SplitTypes.map((type) => {
      const id = encodeQueryId({
        txid: txId,
        amount: parsed.amount,
        currencyCode: currency,
        type,
        description: parsed.description,
      });
      return {
        id: id,
        type: "article" as const,
        title: this.txTitle(type),
        description: description,
        input_message_content: {
          message_text: "the link should be here",
        },
      };
    });

    await this.ctx.answerInlineQuery(replies, {
      button: this.button("Open App (customise)"),
      is_personal: true,
      cache_time: 0,
    });
  }
}

composer.on("inline_query", async (ctx) => {
  const replier = new InlineReplier(ctx);
  const { query, from } = ctx.inlineQuery;
  if (query === "app") {
    await replier.app();
    return;
  }

  if (!from?.id || !env.BOT_INLINE_TX_ENABLED) {
    await replier.shareApp();
    return;
  }

  const user = await db.query.user.findFirst({
    columns: { id: true },
    where: (v, { eq }) => eq(v.telegramId, from.id),
  });
  if (!user) {
    await replier.shareApp();
    return;
  }

  await replier.transaction(query);
});

const calculateContributions = (userId: string, queryId: QueryId) => {
  const isPayer = queryId.type === "LEND" || queryId.type === "LEND_SPLIT";
  if (queryId.type === "LEND" || queryId.type === "BORROW") {
    return [
      {
        userId: userId,
        amountPaid: isPayer ? queryId.amount : 0,
        amountOwed: isPayer ? 0 : queryId.amount,
      },
    ];
  }
  const [amount1] = splitAmount(queryId.amount, 2);

  return [
    {
      userId: userId,
      amountPaid: isPayer ? queryId.amount : 0,
      amountOwed: isPayer ? 0 : amount1!,
    },
  ];
};

composer.on("chosen_inline_result", async (ctx) => {
  if (!env.BOT_INLINE_TX_ENABLED) return;

  console.log("chosen_inline_result", ctx.chosenInlineResult);
  const { from, result_id } = ctx.chosenInlineResult;
  if (!from.id || !result_id) return;

  const queryId = decodeQueryId(result_id);
  if (!queryId) return;

  const user = await db.query.user.findFirst({
    columns: { id: true },
    where: (v, { eq }) => eq(v.telegramId, from.id),
  });
  if (!user) return;

  ctx.logger.info({ queryId }, "creating tx from decoded query id");

  // await mutate.tx.create({
  //   txId: queryId.txid,
  //   createdById: user.id,
  //   amount: queryId.amount,
  //   currencyCode: queryId.currencyCode,
  //   description: queryId.description,
  //   date: null,
  //   contributions: calculateContributions(user.id, queryId),
  //   type: "PAYMENT",
  //   groupId: null,
  // });
});

export default composer;
