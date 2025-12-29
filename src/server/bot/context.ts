import { type ParseModeFlavor } from "@grammyjs/parse-mode";
import { type Context as GrammyContext } from "grammy";
import type { Translator } from "~/server/bot/translator";
import type { Db } from "~/server/db";
import type logger from "~/server/logger";

export type Context = ParseModeFlavor<GrammyContext> & {
  db: Db;
  logger: typeof logger;
  t: Translator;
  replyParsedHTML: (text: string) => Promise<void>;
};
