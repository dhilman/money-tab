import { defineConfig } from "drizzle-kit";

import { env } from "~/env.mjs";

export default defineConfig({
  schema: "./src/server/monitor/mdb/schema.ts",
  dialect: "sqlite",
  out: "migrations/monitor",
  driver: "turso",
  dbCredentials: {
    url: env.MONITOR_DATABASE_URL,
    authToken: env.MONITOR_DATABASE_TOKEN,
  },
  verbose: true,
  strict: true,
});
