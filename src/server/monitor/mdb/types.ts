import type { mschema } from "~/server/monitor/mdb";

export type InsertEvent = typeof mschema.event.$inferInsert;
