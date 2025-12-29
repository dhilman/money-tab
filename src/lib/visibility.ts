import dayjs from "dayjs";
import type { Visibility } from "~/lib/consts/types";

const VISIBILITY_DAYS = 8;

/**
 * Determines if user's can join (and see) subs or txs.
 * Private - can not join
 * Restricted - can join if within VISIBILITY_DAYS days of creation
 * Public - can join
 */
export const calcIsPublic = (params: {
  createdAt: string;
  visibility: Visibility;
}) => {
  if (params.visibility === "PRIVATE") return false;
  if (params.visibility === "PUBLIC") return true;

  const created = dayjs(params.createdAt, { utc: true });
  const now = dayjs();

  return now.diff(created, "day") < VISIBILITY_DAYS;
};

export const calcPublicDays = (createdAt: string) => {
  const created = dayjs(createdAt, { utc: true });
  const now = dayjs();

  return VISIBILITY_DAYS - 1 - now.diff(created, "day");
};
