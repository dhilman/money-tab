import { drizzle } from "drizzle-orm/postgres-js";
import { pgClient } from "~/server/db/pg-client";

import * as mqueries from "./queries";
import * as mschema from "./schema";
import * as mtypes from "./types";

const mdb = drizzle(pgClient, { schema: mschema });

export type Mdb = typeof mdb;

export { mdb, mqueries, mschema, mtypes };
