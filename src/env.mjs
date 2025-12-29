import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),

    // Auth
    AUTH_SECRET: z.string(),

    // Database
    DATABASE_URL: z.string(),
    DATABASE_TOKEN: z.string(),

    // Database (monitoring)
    MONITOR_DATABASE_URL: z.string(),
    MONITOR_DATABASE_TOKEN: z.string(),

    CRON_SECRET: z.string(),

    // Telegram
    BOT_TOKEN: z.string(),
    WEBHOOK_SECRET: z.string(),
    BOT_INLINE_TX_ENABLED: z
      .string()
      .optional()
      .transform((val) => val === "true"),

    // S3
    S3_URL: z.string().url(),
    S3_PREFIX: z.string().optional().default(""),
    S3_BUCKET: z.string(),
    S3_ENDPOINT: z.string().url(),
    S3_ACCESS_KEY: z.string(),
    S3_SECRET_KEY: z.string(),

    // QStash
    QSTASH_URL: z.string().url(),
    QSTASH_TOKEN: z.string(),
    QSTASH_CURRENT_SIGNING_KEY: z.string(),
    QSTASH_NEXT_SIGNING_KEY: z.string(),

    // Old bot
    BOT_TOKEN_OLD: z.string(),

    // Mocking
    MOCK_AUTH: z
      .string()
      .optional()
      .transform((val) => val === "true"),
    MOCK_TG_USER_ID: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined)),
    NOTIFY_DISABLED: z
      .string()
      .optional()
      .transform((val) => val === "true"),
  },
  client: {
    // Env
    NEXT_PUBLIC_ENV: z.enum(["local", "staging", "prod"]),
    NEXT_PUBLIC_NODE_ENV: z.enum(["development", "test", "production"]),
    NEXT_PUBLIC_DEPLOY_ID: z.string(),
    NEXT_PUBLIC_BASE_URL: z.string().url(),

    // Bot
    NEXT_PUBLIC_BOT_ID: z.string().transform((val) => parseInt(val)),
    NEXT_PUBLIC_BOT_USERNAME: z.string(),
    NEXT_PUBLIC_BOT_NAME: z.string(),
    NEXT_PUBLIC_BOT_APP_NAME: z.string(),
  },
  runtimeEnv: {
    // Env
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,

    // Env (Public)
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_DEPLOY_ID: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // Auth
    AUTH_SECRET: process.env.AUTH_SECRET,

    // Cron
    CRON_SECRET: process.env.CRON_SECRET,

    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_TOKEN: process.env.DATABASE_TOKEN,

    // Database (monitoring)
    MONITOR_DATABASE_URL: process.env.MONITOR_DATABASE_URL,
    MONITOR_DATABASE_TOKEN: process.env.MONITOR_DATABASE_TOKEN,

    // Telegram
    BOT_TOKEN: process.env.BOT_TOKEN,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    BOT_INLINE_TX_ENABLED: process.env.BOT_INLINE_TX_ENABLED,

    // S3
    S3_URL: process.env.S3_URL,
    S3_PREFIX: process.env.S3_PREFIX,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,

    // QStash
    QSTASH_URL: process.env.QSTASH_URL,
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,
    QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
    QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,

    // Public

    // Bot
    NEXT_PUBLIC_BOT_ID: process.env.NEXT_PUBLIC_BOT_ID,
    NEXT_PUBLIC_BOT_USERNAME: process.env.NEXT_PUBLIC_BOT_USERNAME,
    NEXT_PUBLIC_BOT_NAME: process.env.NEXT_PUBLIC_BOT_NAME,
    NEXT_PUBLIC_BOT_APP_NAME: process.env.NEXT_PUBLIC_BOT_APP_NAME,

    // Old bot
    BOT_TOKEN_OLD: process.env.BOT_TOKEN_OLD,

    // Mocking
    MOCK_AUTH: process.env.MOCK_AUTH,
    MOCK_TG_USER_ID: process.env.MOCK_TG_USER_ID,
    NOTIFY_DISABLED: process.env.NOTIFY_DISABLED,
  },
});
