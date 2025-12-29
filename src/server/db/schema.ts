import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTableCreator,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  CYCLE_UNITS,
  EVENT_NAMES,
  REMINDER_VALUES,
  VISIBILITY_VALUES,
} from "~/lib/consts/constants";

export const createTable = sqliteTableCreator((name) => name);

const boolean = (name: string) => integer(name, { mode: "boolean" });
const timestamp = (name: string) => text(name, { length: 16 });
const date = (name: string) => text(name, { length: 10 });

const columns = {
  cuid: (name: string) => text(name, { length: 24 }),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
};

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export const user = createTable(
  "users",
  {
    id: columns.cuid("id").primaryKey(),
    createdAt: columns.createdAt,
    updatedAt: columns.updatedAt,
    telegramId: integer("telegram_id", { mode: "number" }).unique(
      "telegram_idx"
    ),
    username: text("username", { length: 256 }),
    firstName: text("first_name", { length: 256 }),
    lastName: text("last_name", { length: 256 }),
    languageCode: text("language_code", { length: 2 }),
    photoUrl: text("photo_url", { length: 256 }),
    isRegistered: boolean("is_registered").notNull().default(false),
    accentColorId: integer("accent_color_id").$defaultFn(() => randomInt(7)),
    tgIsPremium: boolean("tg_is_premium").notNull().default(false),
    timezone: text("timezone", { length: 64 }).default("UTC").notNull(),
    timezoneManual: text("timezone_manual", { length: 64 }),
    role: text("role", { enum: ["USER", "ADMIN", "SUPER"] })
      .notNull()
      .default("USER"),
    referrer: text("referrer"),
    tonAddress: text("ton_address"),

    hideBalance: boolean("hide_balance").notNull().default(false),
    meInPaidFor: boolean("me_in_paid_for").notNull().default(false),
    currencyCode: text("currency_code", { length: 3 }),
  },
  (v) => ({
    createdAtIdx: index("user_created_at_idx").on(sql`${v.createdAt} DESC`),
  })
);

export const connection = createTable(
  "connections",
  {
    createdAt: columns.createdAt,
    ownerId: columns.cuid("from_user_id").notNull(),
    userId: columns.cuid("to_user_id").notNull(),
    nickname: text("to_user_nickname"),
  },
  (v) => ({
    pk: primaryKey({
      columns: [v.ownerId, v.userId],
    }),
    toUserIdx: index("to_user_idx").on(v.userId),
    createdAtIdx: index("connection_created_at_idx").on(
      sql`${v.createdAt} DESC`
    ),
  })
);

export const userRelations = relations(user, ({ many }) => ({
  contactsOwned: many(connection, {
    relationName: "contact_owner_user",
  }),
  contactsUser: many(connection, {
    relationName: "contact_user",
  }),
  transactionsCreated: many(transaction, {
    relationName: "transaction_created_by",
  }),
  contributions: many(contribution, {
    relationName: "contribution_user",
  }),
}));

export const group = createTable(
  "groups",
  {
    id: columns.cuid("id").primaryKey(),
    createdAt: columns.createdAt,
    archivedAt: timestamp("archived_at"),
    createdById: columns.cuid("created_by_id").notNull(),
    name: text("name", { length: 256 }).notNull(),
    telegramId: integer("telegram_id", { mode: "number" }).unique(
      "group_telegram_idx"
    ),
    accentColorId: integer("accent_color_id").$defaultFn(() => randomInt(7)),
    photoUrl: text("photo_url"),
    tgChatType: text("tg_chat_type"),
    tgLinked: boolean("tg_linked").notNull().default(false),
  },
  (v) => ({
    createdAtIdx: index("group_created_at_idx").on(sql`${v.createdAt} DESC`),
    userIdx: index("group_user_idx").on(v.createdById),
  })
);

export const groupRelations = relations(group, ({ one, many }) => ({
  createdBy: one(user, {
    relationName: "group_created_by",
    fields: [group.createdById],
    references: [user.id],
  }),
  memberships: many(membership),
  transactions: many(transaction),
  subscriptions: many(subscription),
}));

export const membership = createTable(
  "memberships",
  {
    id: columns.cuid("id").primaryKey(),
    createdAt: columns.createdAt,
    groupId: columns.cuid("group_id").notNull(),
    userId: columns.cuid("user_id").notNull(),
    role: text("role", { enum: ["MEMBER", "ADMIN"] })
      .notNull()
      .default("MEMBER"),
  },
  (v) => ({
    groupUserIdx: uniqueIndex("membership_group_user_idx").on(
      v.groupId,
      v.userId
    ),
    userIdx: index("membership_user_idx").on(v.userId),
    createdAtIdx: index("membership_created_at_idx").on(
      sql`${v.createdAt} DESC`
    ),
  })
);

export const membershipRelations = relations(membership, ({ one }) => ({
  group: one(group, {
    fields: [membership.groupId],
    references: [group.id],
  }),
  user: one(user, {
    relationName: "membership_user",
    fields: [membership.userId],
    references: [user.id],
  }),
}));

export const connectionRelations = relations(connection, ({ one }) => ({
  owner: one(user, {
    relationName: "contact_owner_user",
    fields: [connection.ownerId],
    references: [user.id],
  }),
  user: one(user, {
    relationName: "contact_user",
    fields: [connection.userId],
    references: [user.id],
  }),
}));

export const subscription = createTable(
  "subscriptions",
  {
    id: columns.cuid("id").primaryKey(),
    createdAt: columns.createdAt,
    createdById: columns.cuid("created_by_id").notNull(),
    archivedAt: timestamp("archived_at"),
    archivedById: columns.cuid("archived_by_id"),
    groupId: columns.cuid("group_id"),
    name: text("name", { length: 256 }).notNull(),
    amount: integer("amount").notNull(),
    currencyCode: text("currency_code", { length: 3 }).default("XXX").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    cycleUnit: text("cycle_unit", { enum: CYCLE_UNITS, length: 5 }).notNull(),
    cycleValue: integer("cycle_value").notNull(),
    trialUnit: text("trial_unit", { enum: CYCLE_UNITS, length: 5 }),
    trialValue: integer("trial_value"),
    visibility: text("visibility", {
      enum: VISIBILITY_VALUES,
    })
      .notNull()
      .default("PRIVATE"),
  },
  (v) => ({
    userIdx: index("subs_user_idx").on(v.createdById),
    createdAtIdx: index("subs_created_at_idx").on(sql`${v.createdAt} DESC`),
  })
);

export const subscriptionRelations = relations(
  subscription,
  ({ one, many }) => ({
    createdBy: one(user, {
      relationName: "subscription_created_by",
      fields: [subscription.createdById],
      references: [user.id],
    }),
    archivedBy: one(user, {
      relationName: "subscription_archived_by",
      fields: [subscription.archivedById],
      references: [user.id],
    }),
    group: one(group, {
      fields: [subscription.groupId],
      references: [group.id],
    }),
    contribs: many(subContrib),
  })
);

export const subContrib = createTable(
  "sub_contribs",
  {
    id: columns.cuid("id").primaryKey(),
    createdAt: columns.createdAt,
    subscriptionId: columns.cuid("subscription_id").notNull(),
    userId: columns.cuid("user_id"),
    // IMPORTANT: there must be exactly one contrib with a positive amountPaid.
    amountPaid: integer("amount_paid").notNull(),
    amountOwed: integer("amount_owed").notNull(),
    manualAmountOwed: boolean("manual_amount_owed").notNull().default(false),

    joinDate: date("join_date").notNull(),
    leaveDate: date("leave_date"),
    status: text("status", {
      enum: ["NOT_DELIVERED", "CONFIRMED"],
    }).notNull(),

    reminder: text("reminder", { enum: REMINDER_VALUES, length: 3 }),
    reminderDate: date("reminder_date"),
  },
  (v) => ({
    subIdUserIdIdx: uniqueIndex("sub_id_user_id_idx").on(
      v.subscriptionId,
      v.userId
    ),
    userId: index("sub_contribs_user_id").on(v.userId),
    reminderDateIdx: index("sub_contribs_reminder_date_idx").on(v.reminderDate),
  })
);

export const subUsersRelations = relations(subContrib, ({ one }) => ({
  subscription: one(subscription, {
    fields: [subContrib.subscriptionId],
    references: [subscription.id],
  }),
  user: one(user, {
    relationName: "sub_user",
    fields: [subContrib.userId],
    references: [user.id],
  }),
}));

export const transaction = createTable(
  "transactions",
  {
    id: columns.cuid("id").primaryKey(),
    createdAt: columns.createdAt,
    createdById: columns.cuid("created_by_id").notNull(),
    archivedById: columns.cuid("archived_by_id"),
    archivedAt: timestamp("archived_at"),
    groupId: columns.cuid("group_id"),
    amount: integer("amount", { mode: "number" }).notNull(),
    currencyCode: text("currency_code", { length: 3 }).default("XXX").notNull(),
    description: text("description", { length: 1024 }),
    date: text("date"),
    type: text("type", { enum: ["PAYMENT", "SETTLE"] }).notNull(),
    visibility: text("visibility", {
      enum: VISIBILITY_VALUES,
    })
      .notNull()
      .default("RESTRICTED"),
  },
  (v) => ({
    createdAtIdx: index("tx_created_at_idx").on(sql`${v.createdAt} DESC`),
    createdByIdx: index("tx_created_by_idx").on(v.createdById),
    groupIdIdx: index("tx_group_id_idx").on(v.groupId),
  })
);

export const transactionRelations = relations(transaction, ({ one, many }) => ({
  createdBy: one(user, {
    relationName: "transaction_created_by",
    fields: [transaction.createdById],
    references: [user.id],
  }),
  archivedBy: one(user, {
    relationName: "transaction_archived_by",
    fields: [transaction.archivedById],
    references: [user.id],
  }),
  group: one(group, {
    fields: [transaction.groupId],
    references: [group.id],
  }),
  contribs: many(contribution),
  files: many(file),
  events: many(event),
}));

/**
 * A contribution is a user's contribution to a transaction.
 * Positive amount means the user paid for the transaction.
 * Negative amount means the user was paid for.
 *
 * IMPORTANT: A transaction MUST have ONE (and only one) contribution with a positive amount.
 */
export const contribution = createTable(
  "tx_contribs",
  {
    id: columns.cuid("id").primaryKey(),
    transactionId: columns.cuid("transaction_id").notNull(),
    userId: columns.cuid("user_id"),
    createdAt: columns.createdAt,
    // IMPORTANT: there must be exactly one contrib with a positive amountPaid.
    amountPaid: integer("amount_paid").notNull(),
    amountOwed: integer("amount_owed").notNull(),
    // If true, the user manually entered the amount owed.
    manualAmountOwed: boolean("manual_amount_owed").notNull().default(false),
    status: text("status", {
      enum: ["NOT_DELIVERED", "CONFIRMED"],
    }).notNull(),
  },
  (v) => ({
    txIdUserIdIdx: uniqueIndex("tx_id_user_id_idx").on(
      v.transactionId,
      v.userId
    ),
    userIdx: index("tx_contribs_user_idx").on(v.userId),
  })
);

export const contributionRelations = relations(contribution, ({ one }) => ({
  transaction: one(transaction, {
    fields: [contribution.transactionId],
    references: [transaction.id],
  }),
  user: one(user, {
    relationName: "contribution_user",
    fields: [contribution.userId],
    references: [user.id],
  }),
}));

export const file = createTable(
  "files",
  {
    id: columns.cuid("id").primaryKey(),
    createdAt: columns.createdAt,
    createdBy: columns.cuid("created_by").notNull(),
    transactionId: columns.cuid("transaction_id"),
    url: text("url").notNull(),
    type: text("type"),
    size: integer("size"),
  },
  (v) => ({
    createdAtIdx: index("file_created_at_idx").on(sql`${v.createdAt} DESC`),
    createdById: index("file_created_by_idx").on(v.createdBy),
    txIdIdx: index("file_tx_id_idx").on(v.transactionId),
  })
);

export const fileRelations = relations(file, ({ one }) => ({
  transaction: one(transaction, {
    fields: [file.transactionId],
    references: [transaction.id],
  }),
}));

export const event = createTable(
  "events",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    createdAt: columns.createdAt,
    name: text("name", {
      length: 64,
      enum: EVENT_NAMES,
    }).notNull(),
    createdById: columns.cuid("created_by_id"),
    targetUserId: columns.cuid("target_user_id"),
    transactionId: columns.cuid("transaction_id"),
    subscriptionId: columns.cuid("subscription_id"),
    groupId: columns.cuid("group_id"),
  },
  (v) => ({
    eventNameCreatedAtIdx: index("event_name_created_at_idx").on(
      v.name,
      sql`${v.createdAt} DESC`
    ),
    createdByIdx: index("event_created_by_idx").on(v.createdById),
    targetUserIdx: index("event_target_user_idx").on(v.targetUserId),
    transactionIdx: index("event_transaction_idx").on(v.transactionId),
    subscriptionIdx: index("event_subscription_idx").on(v.subscriptionId),
    groupIdx: index("event_group_idx").on(v.groupId),
  })
);

export const eventRelations = relations(event, ({ one }) => ({
  createdBy: one(user, {
    relationName: "event_created_by",
    fields: [event.createdById],
    references: [user.id],
  }),
  targetUser: one(user, {
    relationName: "event_target_user",
    fields: [event.targetUserId],
    references: [user.id],
  }),
  transaction: one(transaction, {
    fields: [event.transactionId],
    references: [transaction.id],
  }),
  subscription: one(subscription, {
    fields: [event.subscriptionId],
    references: [subscription.id],
  }),
  group: one(group, {
    fields: [event.groupId],
    references: [group.id],
  }),
}));
