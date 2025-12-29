import dayjs from "dayjs";
import type { Cycle, ReminderValue } from "~/lib/consts/types";
import { cycleUnitToDayjsUnit } from "~/lib/dates/conversions";

export type AnyDate = string | Date | dayjs.Dayjs;
export type ReminderLeadTime = ReminderValue;

let _now = () => dayjs(undefined, { utc: true });

export const TEST_setNow = (fn: () => dayjs.Dayjs) => (_now = fn);

export const dayjsUTC = (date?: AnyDate) => {
  return date ? dayjs(date, { utc: true }) : _now();
};

export const getDateYYYYMMDD = (date: AnyDate) => {
  return dayjs(date).format("YYYY-MM-DD");
};

export const minDate = (a: AnyDate, b: AnyDate | null): dayjs.Dayjs => {
  if (!b) return dayjsUTC(a);
  const dateA = dayjsUTC(a);
  const dateB = dayjsUTC(b);
  if (dateA.isBefore(dateB)) return dateA;
  return dateB;
};

export const isBeforeDay = (d1: dayjs.Dayjs, d2: AnyDate | null) => {
  if (!d2) return true;
  return d1.isBefore(dayjsUTC(d2), "day");
};

export const isBeforeOrEqualToToday = (d: AnyDate) => {
  const today = dayjsUTC();
  const date = dayjsUTC(d);

  return date.isBefore(today, "day") || date.isSame(today, "day");
};

export interface DateRange {
  start: AnyDate;
  end: AnyDate;
}

export const calcCyclesInRange = (dates: DateRange, cycle: Cycle) => {
  const start = dayjsUTC(dates.start);
  const end = dayjsUTC(dates.end);

  const diff = end.diff(start, cycleUnitToDayjsUnit(cycle.unit), true);
  const cycles = diff / cycle.value;
  if (cycles < 0) return 0;
  return cycles;
};

export const isDateInRange = (date: AnyDate, range: DateRange) => {
  const d = dayjsUTC(date);
  const start = dayjsUTC(range.start);
  const end = dayjsUTC(range.end);

  return (
    (d.isAfter(start, "day") || d.isSame(start, "day")) &&
    d.isBefore(end, "day")
  );
};
