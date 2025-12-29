import type { Dayjs } from "dayjs";
import { type Column, and, gte, lt } from "drizzle-orm";

export const DB_DATE_FORMAT = "YYYY-MM-DD";
export const DB_DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

export const dayjsToSqlDate = (date: Dayjs) => {
  return date.format(DB_DATE_FORMAT);
};

export const dayjsToSqlDateNullable = (date: Dayjs | null) => {
  return date ? dayjsToSqlDate(date) : null;
};

export const dateToSqlDateTime = (date: Date) => {
  function pad(n: number) {
    return n < 10 ? `0${n}` : n;
  }

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const dateToSqlDateTimeNullable = (date: Date | null) => {
  return date ? dateToSqlDateTime(date) : null;
};

export const dateToSqlDate = (date: Date) => {
  function pad(n: number) {
    return n < 10 ? `0${n}` : n;
  }

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  return `${year}-${month}-${day}`;
};

export const dateToSqlDateNullable = (date: Date | null) => {
  return date ? dateToSqlDate(date) : null;
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
