import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "~/server/db";
import { mdb } from "~/server/monitor/mdb";

await migrate(db, { migrationsFolder: "migrations/pg/main" });
await migrate(mdb, { migrationsFolder: "migrations/pg/monitor" });
