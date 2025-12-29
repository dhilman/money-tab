import { join } from "path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "**/e2e/**"],
    env: {
      NODE_ENV: "test",
      NEXT_PUBLIC_ENV: "local",
      NEXT_PUBLIC_NODE_ENV: "test",
      NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: "local",
      NEXT_PUBLIC_BASE_URL: "http://localhost:3000",

      AUTH_SECRET: "123",
      CRON_SECRET: "123",

      // DATABASE_URL: ":memory:",
      DATABASE_URL: "file:data/db/test/main.db",
      DATABASE_TOKEN: "123",

      MONITOR_DATABASE_URL: "file:data/db/test/monitor.db",
      MONITOR_DATABASE_TOKEN: "123",

      BOT_TOKEN: "123",
      WEBHOOK_SECRET: "123",
      BOT_INLINE_TX_ENABLED: "false",

      S3_URL: "https://s3.amazonaws.com",
      S3_PREFIX: "prefix",
      S3_BUCKET: "bucket",
      S3_ENDPOINT: "http://localhost:1234",
      S3_ACCESS_KEY: "123",
      S3_SECRET_KEY: "123",

      QSTASH_URL: "http://qstash.com",
      QSTASH_TOKEN: "123",
      QSTASH_CURRENT_SIGNING_KEY: "123",
      QSTASH_NEXT_SIGNING_KEY: "123",

      NEXT_PUBLIC_BOT_ID: "123",
      NEXT_PUBLIC_BOT_USERNAME: "bot",
      NEXT_PUBLIC_BOT_NAME: "bot",
      NEXT_PUBLIC_BOT_APP_NAME: "bot",

      BOT_TOKEN_OLD: "123",

      MOCK_AUTH: "true",
      NOTIFY_DISABLED: "true",
    },
  },
  resolve: {
    alias: {
      "~/": join(__dirname, "./src/"),
    },
  },
});
