import type { Dayjs } from "dayjs";
import type { Cycle, ReminderValue } from "~/lib/consts/types";
import {
  addCycles,
  addLeadTime,
  subtractLeadTime,
} from "~/lib/dates/conversions";
import {
  calcCyclesInRange,
  dayjsUTC,
  isBeforeDay,
  minDate,
  type AnyDate,
  type DateRange,
} from "~/lib/dates/dates";

interface Subscription {
  startDate: AnyDate;
  endDate: AnyDate | null;
  cycle: Cycle;
}

export const calcRenewalDate = (sub: Subscription) => {
  const after = dayjsUTC().subtract(1, "day").endOf("day");
  return calcRenewalDateAfter(sub, after);
};

export const calcRenewalDateAfterToday = (sub: Subscription) => {
  const after = dayjsUTC().endOf("day");
  return calcRenewalDateAfter(sub, after);
};

export const calcRenewalsPassed = (sub: Subscription, toDate?: AnyDate) => {
  const toDateOrTmr = toDate ? toDate : dayjsUTC().add(1, "day").startOf("day");
  const end = minDate(toDateOrTmr, sub.endDate);
  return Math.ceil(
    calcCyclesInRange({ start: sub.startDate, end: end }, sub.cycle),
  );
};

export const calcRenewalsInRange = (sub: Subscription, range: DateRange) => {
  const end = minDate(range.end, sub.endDate);

  const start = calcRenewalDateAfter(
    sub,
    dayjsUTC(range.start).subtract(1, "day").endOf("day"),
  );
  if (!start) return 0;

  const cycles = calcCyclesInRange({ start, end }, sub.cycle);
  return Math.ceil(cycles);
};

export const calcRenewalDateAfter = (sub: Subscription, after: Dayjs) => {
  const start = dayjsUTC(sub.startDate);

  if (start.isAfter(after)) {
    if (isBeforeDay(start, sub.endDate)) return start;
    return start;
  }

  const cycles = calcCyclesInRange({ start: start, end: after }, sub.cycle);
  const cyclesPassed = Math.ceil(cycles) || 1;
  const renewal = addCycles(start, sub.cycle, cyclesPassed);

  if (isBeforeDay(renewal, sub.endDate)) return renewal;
  return null;
};

export const calcReminderDate = (
  sub: Subscription,
  leadTime: ReminderValue | null,
) => {
  const today = dayjsUTC().endOf("day");

  if (!leadTime) return null;
  const firstRenewal = calcRenewalDateAfter(sub, today);
  if (!firstRenewal) return null;

  const firstReminder = subtractLeadTime(firstRenewal, leadTime);
  if (today.isBefore(firstReminder)) return firstReminder;

  const secondRenewal = calcRenewalDateAfter(sub, firstRenewal.add(1, "day"));
  if (!secondRenewal) return null;

  const secondReminder = subtractLeadTime(secondRenewal, leadTime);
  if (today.isBefore(secondReminder)) return secondReminder;

  return null;
};

export const calcNextReminderDate = (params: {
  reminderDate: AnyDate;
  cycle: Cycle;
  endDate: AnyDate | null;
  leadTime: ReminderValue;
}) => {
  const nextReminderDate = addCycles(
    dayjsUTC(params.reminderDate),
    params.cycle,
    1,
  );
  const nextRenewal = addLeadTime(nextReminderDate, params.leadTime);

  if (isBeforeDay(nextRenewal, params.endDate)) return nextReminderDate;

  return null;
};
