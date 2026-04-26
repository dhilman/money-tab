import { defineConfig } from "drizzle-kit";

import { env } from "~/env.mjs";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  out: "migrations/pg/main",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  schemaFilter: ["main"],
  verbose: true,
  strict: true,
});
