import { z } from "zod";

const UserSchema = z.object({
  telegramId: z.number().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  username: z.string().nullable(),
});

const ShareProfileSchema = z.object({
  type: z.literal("share_profile"),
  userId: z.string(),
});

const ShareTransactionSchema = z.object({
  type: z.literal("share_transaction"),
  createdBy: UserSchema,
  description: z.string().nullable(),
  amount: z.number(),
  currencyCode: z.string(),
  transactionId: z.string(),
});

const TxCreatedEvent = z.object({
  type: z.literal("tx_created"),
  createdBy: UserSchema,
  transactionId: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
  description: z.string().nullable(),
});

const SettleEventSchema = z.object({
  type: z.literal("settle_event"),
  createdBy: UserSchema,
  transactionId: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
});

const TxArchivedEvent = z.object({
  type: z.literal("tx_archived"),
  createdBy: UserSchema,
  transactionId: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
  description: z.string().nullable(),
});

const TxJoinedEvent = z.object({
  type: z.literal("tx_joined"),
  user: UserSchema,
  transactionId: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
  description: z.string().nullable(),
});

const TxLeftEvent = z.object({
  type: z.literal("tx_left"),
  user: UserSchema,
  transactionId: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
  description: z.string().nullable(),
});

const TxRemovedUser = z.object({
  type: z.literal("tx_removed_user"),
  createdBy: UserSchema,
  transactionId: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
  description: z.string().nullable(),
});

const SubCreatedEvent = z.object({
  type: z.literal("sub_created"),
  createdBy: UserSchema,
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
});

const SubsReminderEvent = z.object({
  type: z.literal("subs_reminder"),
  subs: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amount: z.number(),
      currencyCode: z.string(),
      renewalDate: z.string(),
    }),
  ),
});

const SubJoinedEvent = z.object({
  type: z.literal("sub_joined"),
  user: UserSchema,
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
});

const SubLeft = z.object({
  type: z.literal("sub_left"),
  user: UserSchema,
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
});

const SubRemovedUser = z.object({
  type: z.literal("sub_removed_user"),
  createdBy: UserSchema,
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  currencyCode: z.string(),
});

const GroupCreatedEvent = z.object({
  type: z.literal("group_created"),
  createdBy: UserSchema,
  id: z.string(),
  name: z.string(),
});

export const NotifyDataSchema = z.union([
  ShareProfileSchema,
  ShareTransactionSchema,
  TxCreatedEvent,
  TxArchivedEvent,
  SettleEventSchema,
  TxJoinedEvent,
  TxLeftEvent,
  TxRemovedUser,
  SubCreatedEvent,
  SubsReminderEvent,
  SubJoinedEvent,
  SubLeft,
  SubRemovedUser,
  GroupCreatedEvent,
]);
export type NotifyDataSingle = z.infer<typeof NotifyDataSchema>;
