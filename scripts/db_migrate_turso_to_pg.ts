/**
 * Migration script: Turso (LibSQL) → PostgreSQL
 *
 * Reads all data from the prod Turso databases (via .env.prod),
 * transforms dates from strings to native Date objects,
 * and writes to a local Postgres database.
 *
 * Usage:
 *   pnpm tsx ./scripts/db_migrate_turso_to_pg.ts
 *
 * Prerequisites:
 *   - Run schema migrations on the target Postgres DB first
 *   - Ensure .env.prod has the Turso credentials
 */

import { createClient } from "@libsql/client";
import { confirm } from "@inquirer/prompts";
import { drizzle as drizzleSqlite } from "drizzle-orm/libsql";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Old sqlite schemas (for typed reads)
import * as oldSchema from "~/server/db/schema.sqlite";
import * as oldMonitorSchema from "~/server/monitor/mdb/schema.sqlite";

// New pg schemas (for typed writes)
import * as newSchema from "~/server/db/schema";
import * as newMonitorSchema from "~/server/monitor/mdb/schema";

// --------------- Setup ---------------

const POSTGRES_URL = "postgres://postgres:postgres@localhost:5432/money_tab_prod";

const tursoMain = createClient({
  url: "file:./data/money-prod-main.db",
});
const tursoMonitor = createClient({
  url: "file:./data/money-prod-monitor.db",
});

const oldDb = drizzleSqlite(tursoMain, { schema: oldSchema });
const oldMdb = drizzleSqlite(tursoMonitor, { schema: oldMonitorSchema });

const pgClient = postgres(POSTGRES_URL);
const newDb = drizzlePg(pgClient, { schema: newSchema });
const newMdb = drizzlePg(pgClient, { schema: newMonitorSchema });

// --------------- Date helpers ---------------

function parseTimestamp(v: string | null): Date | null {
  if (!v) return null;
  return new Date(v.includes("T") ? v : v + "Z");
}

function parseTimestampNotNull(v: string): Date {
  return new Date(v.includes("T") ? v : v + "Z");
}

function parseDate(v: string | null): Date | null {
  if (!v) return null;
  return new Date(v);
}

function parseDateNotNull(v: string): Date {
  return new Date(v);
}

/** Clamp amount to bigint-safe range (garbage data like 1e+33 exists) */
const MAX_BIGINT = 9_007_199_254_740_991; // Number.MAX_SAFE_INTEGER
function clampAmount(v: number): number {
  if (v > MAX_BIGINT) return 0;
  if (v < -MAX_BIGINT) return 0;
  return v;
}

/** Split old transaction date text into txDate + txTime */
function splitTxDate(v: string | null): {
  txDate: Date | null;
  txTime: string | null;
} {
  if (!v) return { txDate: null, txTime: null };
  if (v.length === 10) return { txDate: new Date(v), txTime: null };
  // "YYYY-MM-DD HH:mm:ss"
  return { txDate: new Date(v), txTime: v.slice(11) };
}

// --------------- Batch insert helper ---------------

const BATCH_SIZE = 50;

async function batchInsert<T extends Record<string, unknown>>(
  table: Parameters<(typeof newDb)["insert"]>[0],
  rows: T[],
  label: string,
) {
  if (rows.length === 0) {
    console.log(`  ${label}: 0 rows (skip)`);
    return;
  }
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (newDb.insert(table).values(batch as any) as any);
  }
  console.log(`  ${label}: ${rows.length} rows`);
}

async function batchInsertMonitor<T extends Record<string, unknown>>(
  table: Parameters<(typeof newMdb)["insert"]>[0],
  rows: T[],
  label: string,
  options?: { onConflictDoNothing?: boolean },
) {
  if (rows.length === 0) {
    console.log(`  ${label}: 0 rows (skip)`);
    return;
  }
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = newMdb.insert(table).values(batch as any) as any;
    if (options?.onConflictDoNothing) {
      await q.onConflictDoNothing();
    } else {
      await q;
    }
  }
  console.log(`  ${label}: ${rows.length} rows`);
}

// --------------- Main database migration ---------------

async function migrateMain() {
  console.log("\n=== Migrating MAIN database ===\n");

  // 1. Users
  const users = await oldDb.select().from(oldSchema.user);
  await batchInsert(
    newSchema.user,
    users.map((u) => ({
      ...u,
      createdAt: parseTimestampNotNull(u.createdAt),
      updatedAt: parseTimestampNotNull(u.updatedAt),
    })),
    "users",
  );

  // 2. Connections
  const connections = await oldDb.select().from(oldSchema.connection);
  await batchInsert(
    newSchema.connection,
    connections.map((c) => ({
      ...c,
      createdAt: parseTimestampNotNull(c.createdAt),
    })),
    "connections",
  );

  // 3. Groups
  const groups = await oldDb.select().from(oldSchema.group);
  await batchInsert(
    newSchema.group,
    groups.map((g) => ({
      ...g,
      createdAt: parseTimestampNotNull(g.createdAt),
      archivedAt: parseTimestamp(g.archivedAt),
    })),
    "groups",
  );

  // 4. Memberships
  const memberships = await oldDb.select().from(oldSchema.membership);
  await batchInsert(
    newSchema.membership,
    memberships.map((m) => ({
      ...m,
      createdAt: parseTimestampNotNull(m.createdAt),
    })),
    "memberships",
  );

  // 5. Subscriptions
  const subscriptions = await oldDb.select().from(oldSchema.subscription);
  await batchInsert(
    newSchema.subscription,
    subscriptions.map((s) => ({
      ...s,
      amount: clampAmount(s.amount),
      createdAt: parseTimestampNotNull(s.createdAt),
      archivedAt: parseTimestamp(s.archivedAt),
      startDate: parseDateNotNull(s.startDate),
      endDate: parseDate(s.endDate),
    })),
    "subscriptions",
  );

  // 6. Sub contribs
  const subContribs = await oldDb.select().from(oldSchema.subContrib);
  await batchInsert(
    newSchema.subContrib,
    subContribs.map((sc) => ({
      ...sc,
      amountPaid: clampAmount(sc.amountPaid),
      amountOwed: clampAmount(sc.amountOwed),
      createdAt: parseTimestampNotNull(sc.createdAt),
      joinDate: parseDateNotNull(sc.joinDate),
      leaveDate: parseDate(sc.leaveDate),
      reminderDate: parseDate(sc.reminderDate),
    })),
    "sub_contribs",
  );

  // 7. Transactions
  const transactions = await oldDb.select().from(oldSchema.transaction);
  await batchInsert(
    newSchema.transaction,
    transactions.map((t) => {
      const { date, ...rest } = t;
      const { txDate, txTime } = splitTxDate(date);
      return {
        ...rest,
        amount: clampAmount(t.amount),
        createdAt: parseTimestampNotNull(t.createdAt),
        archivedAt: parseTimestamp(t.archivedAt),
        txDate,
        txTime,
      };
    }),
    "transactions",
  );

  // 8. Contributions (tx_contribs)
  const contributions = await oldDb.select().from(oldSchema.contribution);
  await batchInsert(
    newSchema.contribution,
    contributions.map((c) => ({
      ...c,
      amountPaid: clampAmount(c.amountPaid),
      amountOwed: clampAmount(c.amountOwed),
      createdAt: parseTimestampNotNull(c.createdAt),
    })),
    "tx_contribs",
  );

  // 9. Files
  const files = await oldDb.select().from(oldSchema.file);
  await batchInsert(
    newSchema.file,
    files.map((f) => ({
      ...f,
      createdAt: parseTimestampNotNull(f.createdAt),
    })),
    "files",
  );

  // 10. Events (main)
  const events = await oldDb.select().from(oldSchema.event);
  await batchInsert(
    newSchema.event,
    events.map((e) => ({
      ...e,
      createdAt: parseTimestampNotNull(e.createdAt),
    })),
    "events",
  );

  // Reset events serial sequence
  if (events.length > 0) {
    const maxId = Math.max(...events.map((e) => e.id));
    await pgClient.unsafe(
      `SELECT setval(pg_get_serial_sequence('main.events', 'id'), ${maxId})`,
    );
    console.log(`  events serial reset to ${maxId}`);
  }
}

// --------------- Monitor database migration ---------------

async function migrateMonitor() {
  console.log("\n=== Migrating MONITOR database ===\n");

  // 1. Sessions
  const sessions = await oldMdb.select().from(oldMonitorSchema.session);
  await batchInsertMonitor(
    newMonitorSchema.session,
    sessions.map((s) => ({
      ...s,
      startAt: parseTimestampNotNull(s.startAt),
      lastActiveAt: parseTimestampNotNull(s.lastActiveAt),
      endAt: parseTimestamp(s.endAt),
    })),
    "sessions",
  );

  // 2. Events (monitor)
  const events = await oldMdb.select().from(oldMonitorSchema.event);
  await batchInsertMonitor(
    newMonitorSchema.event,
    events.map((e) => ({
      ...e,
      timestamp: parseTimestampNotNull(e.timestamp),
      loadTime: e.loadTime != null ? Math.round(e.loadTime) : null,
      interactiveTime:
        e.interactiveTime != null ? Math.round(e.interactiveTime) : null,
    })),
    "events",
    { onConflictDoNothing: true },
  );

  // Reset events serial sequence
  if (events.length > 0) {
    const maxId = Math.max(...events.map((e) => e.id));
    await pgClient.unsafe(
      `SELECT setval(pg_get_serial_sequence('monitor.events', 'id'), ${maxId})`,
    );
    console.log(`  events serial reset to ${maxId}`);
  }

  // 3. Issues
  const issues = await oldMdb.select().from(oldMonitorSchema.issue);
  await batchInsertMonitor(
    newMonitorSchema.issue,
    issues.map((i) => ({
      ...i,
      timestamp: parseTimestampNotNull(i.timestamp),
      resolvedAt: parseTimestamp(i.resolvedAt),
    })),
    "issues",
  );

  // Reset issues serial sequence
  if (issues.length > 0) {
    const maxId = Math.max(...issues.map((i) => i.id));
    await pgClient.unsafe(
      `SELECT setval(pg_get_serial_sequence('monitor.issues', 'id'), ${maxId})`,
    );
    console.log(`  issues serial reset to ${maxId}`);
  }
}

// --------------- Verification ---------------

async function verify() {
  console.log("\n=== Verification ===\n");

  const counts = [
    { name: "users", old: oldSchema.user, new: newSchema.user },
    { name: "connections", old: oldSchema.connection, new: newSchema.connection },
    { name: "groups", old: oldSchema.group, new: newSchema.group },
    { name: "memberships", old: oldSchema.membership, new: newSchema.membership },
    {
      name: "subscriptions",
      old: oldSchema.subscription,
      new: newSchema.subscription,
    },
    { name: "sub_contribs", old: oldSchema.subContrib, new: newSchema.subContrib },
    {
      name: "transactions",
      old: oldSchema.transaction,
      new: newSchema.transaction,
    },
    {
      name: "tx_contribs",
      old: oldSchema.contribution,
      new: newSchema.contribution,
    },
    { name: "files", old: oldSchema.file, new: newSchema.file },
    { name: "events", old: oldSchema.event, new: newSchema.event },
  ];

  let allMatch = true;
  for (const { name, old, new: newTable } of counts) {
    const [oldCount] = await oldDb
      .select({ count: (await import("drizzle-orm")).count() })
      .from(old);
    const [newCount] = await newDb
      .select({ count: (await import("drizzle-orm")).count() })
      .from(newTable);

    const match = oldCount!.count === newCount!.count;
    const icon = match ? "OK" : "MISMATCH";
    console.log(
      `  ${name}: ${oldCount!.count} → ${newCount!.count} [${icon}]`,
    );
    if (!match) allMatch = false;
  }

  // Monitor tables
  const monitorCounts = [
    {
      name: "monitor.sessions",
      old: oldMonitorSchema.session,
      new: newMonitorSchema.session,
    },
    {
      name: "monitor.events",
      old: oldMonitorSchema.event,
      new: newMonitorSchema.event,
    },
    {
      name: "monitor.issues",
      old: oldMonitorSchema.issue,
      new: newMonitorSchema.issue,
    },
  ];

  for (const { name, old, new: newTable } of monitorCounts) {
    const [oldCount] = await oldMdb
      .select({ count: (await import("drizzle-orm")).count() })
      .from(old);
    const [newCount] = await newMdb
      .select({ count: (await import("drizzle-orm")).count() })
      .from(newTable);

    const match = oldCount!.count === newCount!.count;
    const icon = match ? "OK" : "MISMATCH";
    console.log(
      `  ${name}: ${oldCount!.count} → ${newCount!.count} [${icon}]`,
    );
    if (!match) allMatch = false;
  }

  console.log(allMatch ? "\nAll counts match!" : "\nSome counts do not match!");
}

// --------------- Run ---------------

console.log("Turso → PostgreSQL Migration");
console.log(`  SQLite main:    ./data/money-prod-main.db`);
console.log(`  SQLite monitor: ./data/money-prod-monitor.db`);
console.log(`  Postgres:       ${POSTGRES_URL}`);

const ok = await confirm({
  message: "Proceed with migration?",
  default: false,
});
if (!ok) {
  console.log("Cancelled.");
  process.exit(0);
}

try {
  await migrateMain();
  await migrateMonitor();
  await verify();
} catch (err) {
  console.error("Migration failed:", err);
  process.exit(1);
} finally {
  await pgClient.end();
  console.log("\nDone.");
}
