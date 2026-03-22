import type { Dayjs } from "dayjs";
import { type Column, and, gte, lt } from "drizzle-orm";

export const dayjsToDate = (date: Dayjs): Date => {
  return date.toDate();
};

export const dayjsToDateNullable = (date: Dayjs | null): Date | null => {
  return date ? dayjsToDate(date) : null;
};

export function prefix(col: Column, prefix: string) {
  const inc = incLastChar(prefix);
  return and(gte(col, prefix), lt(col, inc));
}

function incLastChar(str: string) {
  const lastChar = str.slice(-1);
  const rest = str.slice(0, -1);
  return rest + String.fromCharCode(lastChar.charCodeAt(0) + 1);
}
