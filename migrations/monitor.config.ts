import { defineConfig } from "drizzle-kit";

import { env } from "~/env.mjs";

export default defineConfig({
  schema: "./src/server/monitor/mdb/schema.ts",
  dialect: "postgresql",
  out: "migrations/pg/monitor",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  schemaFilter: ["monitor"],
  verbose: true,
  strict: true,
});
