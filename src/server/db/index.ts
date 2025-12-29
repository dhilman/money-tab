import * as mutate from "./mutate";
import * as queries from "./queries";
import * as schema from "./schema";
import * as db_utils from "./utils";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "~/env.mjs";

export interface DbCtx {
  db: Db;
}

export interface DbUserCtx {
  db: Db;
  userId: string;
}

export interface DbTxUserCtx {
  db: DbTx;
  userId: string;
}

const dbClient = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_TOKEN,
});

const db = drizzle(dbClient, { schema });

export type Db = typeof db;
export type DbTx = Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];
export type DbOrTx = DbTx | typeof db;

export { db, db_utils, mutate, queries, schema };
