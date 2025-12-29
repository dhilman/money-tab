import { select } from "@inquirer/prompts";
import { migrate } from "drizzle-orm/libsql/migrator";
import { confirmOrExit, createDbClient, selectEnv } from "scripts/cli_utils";

const MIGRATE_DIR = {
  main: "migrations/main",
  monitor: "migrations/monitor",
} as const;

const { env } = await selectEnv();

const dbName = await select({
  message: "Select database to migrate",
  choices: [
    { name: "Main", value: "main" as const },
    { name: "Monitoring", value: "monitor" as const },
  ],
});

const { db, config } = createDbClient(dbName, env);

await confirmOrExit(`Migrate ${dbName} database at ${config.url}?`);

console.log("Migrating database...");
await migrate(db, { migrationsFolder: MIGRATE_DIR[dbName] });
console.log("Database migrated");
