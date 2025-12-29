export const MAX_PAID_FOR = 10;

export const CYCLE_UNITS = ["DAY", "WEEK", "MONTH", "YEAR"] as const;

export const REMINDER_VALUES = [
  "0D",
  "1D",
  "2D",
  "3D",
  "1W",
  "2W",
  "1M",
  "3M",
  "6M",
] as const;

export const VISIBILITY_VALUES = ["PUBLIC", "RESTRICTED", "PRIVATE"] as const;

export const EVENT_NAMES = [
  "user_created",
  "user_registered",
  "user_unregistered",
  "user_connected",
  "user_disconnected",
  "amount_updated",
  "tx_created",
  "tx_archived",
  "tx_joined",
  "tx_left",
  "tx_updated",
  "sub_created",
  "sub_cancelled",
  "sub_archived",
  "sub_joined",
  "sub_left",
  "sub_updated",
  "group_created",
  "group_joined",
  "group_left",
  "group_linked",
  "group_unlinked",
  "group_archived",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];
