import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "~/env.mjs";

import * as mqueries from "./queries";
import * as mschema from "./schema";
import * as mtypes from "./types";

const client = createClient({
  url: env.MONITOR_DATABASE_URL,
  authToken: env.MONITOR_DATABASE_TOKEN,
});

const mdb = drizzle(client, { schema: mschema });

export type Mdb = typeof mdb;

export { mdb, mqueries, mschema, mtypes };
