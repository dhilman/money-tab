import type * as schema from "./schema";

export type InsertEvent = typeof schema.event.$inferInsert;
export type SelectEvent = typeof schema.event.$inferSelect;

export type ContributionStatus =
  (typeof schema.contribution.$inferSelect)["status"];

export type InsertUser = typeof schema.user.$inferInsert;

export type SelectUser = typeof schema.user.$inferSelect;
export type SelectUserNotify = Pick<
  SelectUser,
  "id" | "telegramId" | "isRegistered" | "languageCode"
>;

export type SelectFile = typeof schema.file.$inferSelect;
export type InsertFile = typeof schema.file.$inferInsert;

export type SelectTx = typeof schema.transaction.$inferSelect;
export type InsertTx = typeof schema.transaction.$inferInsert;

export type SelectContrib = typeof schema.contribution.$inferSelect;
export type InsertContrib = typeof schema.contribution.$inferInsert;

export type SelectTxWithContribs = SelectTx & {
  contribs: SelectContrib[];
};

export type SelectTxComplete = SelectTx & {
  createdBy: SelectUser;
  contribs: SelectContrib[];
  files: SelectFile[];
};

export type SelectSub = typeof schema.subscription.$inferSelect;
export type SelectSubContrib = typeof schema.subContrib.$inferSelect;
export type InsertSub = typeof schema.subscription.$inferInsert;
export type InsertSubContrib = typeof schema.subContrib.$inferInsert;

export type SelectSubComplete = SelectSub & {
  contribs: SelectSubContrib[];
};

export type SelectGroup = typeof schema.group.$inferSelect;
export type InsertGroup = typeof schema.group.$inferInsert;
