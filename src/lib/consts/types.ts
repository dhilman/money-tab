import type { EVENT_NAMES, REMINDER_VALUES } from "~/lib/consts/constants";

export interface BaseUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  accentColorId: number | null;
  nickname?: string | null;
}

export interface BaseGroup {
  id: string;
  name: string;
  photoUrl: string | null;
  accentColorId: number | null;
}

export interface MainEvent {
  id: number;
  createdAt: string;
  name: (typeof EVENT_NAMES)[number];
  createdById: string | null;
  targetUserId: string | null;
  transactionId: string | null;
  subscriptionId: string | null;
  groupId: string | null;
}

export type Visibility = "PUBLIC" | "PRIVATE" | "RESTRICTED";

export type CycleUnit = "DAY" | "WEEK" | "MONTH" | "YEAR";

export type Cycle = {
  unit: CycleUnit;
  value: number;
};

export type ReminderValue = (typeof REMINDER_VALUES)[number];
