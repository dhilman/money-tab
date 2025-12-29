import { defineConfig } from "drizzle-kit";

import { env } from "~/env.mjs";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  dialect: "sqlite",
  out: "migrations/main",
  driver: "turso",
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_TOKEN || "123",
  },
  verbose: true,
  strict: true,
});
