import { db, schema } from "~/server/db";
import type { InsertEvent } from "~/server/db/types";

type TrackEvent = Omit<InsertEvent, "id" | "createdAt">;

export function track(first: TrackEvent, ...rest: TrackEvent[]) {
  return db.insert(schema.event).values([first, ...rest]);
}
