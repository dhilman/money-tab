import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTableCreator,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createTable = sqliteTableCreator((name) => name);

const boolean = (name: string) => integer(name, { mode: "boolean" });

export const event = createTable(
  "events",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    timestamp: text("timestamp").notNull(),
    userId: text("user_id"),
    type: text("type").notNull(),
    sessionId: text("session_id"),
    isAnonymous: boolean("is_anonymous").default(false),

    name: text("name"),
    host: text("host"),
    path: text("path"),
    query: text("query"),

    // Load time in milliseconds
    // This can be the page load time or the time for a specific event.
    loadTime: integer("load_time"),
    // Page interactive time in milliseconds
    interactiveTime: integer("interactive_time"),
  },
  (table) => ({
    uniqueIdx: uniqueIndex("events_time_name_user_idx").on(
      // desc index
      table.timestamp,
      table.type,
      table.userId
    ),
    sessionIds: index("events_session_id_idx").on(table.sessionId),
  })
);

export const eventRelations = relations(event, ({ one }) => ({
  session: one(session, {
    relationName: "event_session",
    fields: [event.sessionId],
    references: [session.id],
  }),
}));

export const session = createTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    isAnonymous: boolean("is_anonymous").default(false),
    startAt: text("start_at").notNull(),
    lastActiveAt: text("last_active_at").notNull(),
    endAt: text("end_at"),

    host: text("host").notNull(),
    path: text("path"),
    query: text("query"),

    ipAddress: text("ip_address"),
    continent: text("continent"),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    latitude: text("latitude"),
    longitude: text("longitude"),
    timezone: text("timezone"),

    userAgent: text("user_agent"),
    deviceType: text("device_type"),
    deviceVendor: text("device_vendor"),
    deviceModel: text("device_model"),
    os: text("os"),
    browser: text("browser"),
    engine: text("engine"),

    referrer: text("referrer"),
    referrerHost: text("referrer_host"),
  },
  (table) => ({
    userIdx: index("sessions_user_idx").on(table.userId),
    // desc index
    startAtIdx: index("sessions_start_at_idx").on(table.startAt),
  })
);

export const sessionRelations = relations(session, ({ many }) => ({
  events: many(event),
  issues: many(issue),
}));

export const issue = createTable(
  "issues",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    timestamp: text("timestamp").notNull(),
    appVersion: text("app_version"),

    // hash of (path, procedure, type, message, stack)
    hash: text("hash").notNull(),

    path: text("path"),
    procedure: text("procedure"),
    type: text("type").notNull(),
    message: text("message"),
    stack: text("stack"),
    statusCode: integer("status_code"),

    userId: text("user_id"),
    sessionId: text("session_id"),

    resolvedAt: text("resolved_at"),
    properties: text("properties", { mode: "json" }),
  },
  (table) => ({
    resolvedAtHash: index("issues_resolved_at_hash_idx").on(
      table.resolvedAt,
      table.hash
    ),
  })
);

export const issueRelations = relations(issue, ({ one }) => ({
  session: one(session, {
    relationName: "issue_session",
    fields: [issue.sessionId],
    references: [session.id],
  }),
}));
