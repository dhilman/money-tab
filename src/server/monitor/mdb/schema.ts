import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgSchema,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const monitorSchema = pgSchema("monitor");
const createTable = monitorSchema.table;

export const event = createTable(
  "events",
  {
    id: serial("id").primaryKey(),
    timestamp: timestamp("timestamp", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
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
  (table) => [
    uniqueIndex("events_time_name_user_idx").on(
      table.timestamp,
      table.type,
      table.userId,
    ),
    index("events_session_id_idx").on(table.sessionId),
  ],
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
    startAt: timestamp("start_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    lastActiveAt: timestamp("last_active_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true, mode: "date" }),

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
  (table) => [
    index("sessions_user_idx").on(table.userId),
    index("sessions_start_at_idx").on(table.startAt),
  ],
);

export const sessionRelations = relations(session, ({ many }) => ({
  events: many(event),
  issues: many(issue),
}));

export const issue = createTable(
  "issues",
  {
    id: serial("id").primaryKey(),
    timestamp: timestamp("timestamp", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
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

    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" }),
    properties: jsonb("properties"),
  },
  (table) => [
    index("issues_resolved_at_hash_idx").on(table.resolvedAt, table.hash),
  ],
);

export const issueRelations = relations(issue, ({ one }) => ({
  session: one(session, {
    relationName: "issue_session",
    fields: [issue.sessionId],
    references: [session.id],
  }),
}));
