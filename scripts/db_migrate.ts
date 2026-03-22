import { select } from "@inquirer/prompts";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { confirmOrExit, selectEnv } from "scripts/cli_utils";

const MIGRATE_CONFIG = {
  main: {
    migrationsFolder: "migrations/pg/main",
    migrationsTable: "__drizzle_migrations_main",
  },
  monitor: {
    migrationsFolder: "migrations/pg/monitor",
    migrationsTable: "__drizzle_migrations_monitor",
  },
} as const;

const { env } = await selectEnv();

const dbName = await select({
  message: "Select database to migrate",
  choices: [
    { name: "Main", value: "main" as const },
    { name: "Monitoring", value: "monitor" as const },
  ],
});

const client = postgres(env.DATABASE_URL);
const db = drizzle(client);

await confirmOrExit(`Migrate ${dbName} schema at ${env.DATABASE_URL}?`);

console.log("Migrating database...");
await migrate(db, MIGRATE_CONFIG[dbName]);
console.log("Database migrated");

await client.end();
