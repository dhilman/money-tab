import type { Dayjs, ManipulateType } from "dayjs";
import type { Cycle, CycleUnit, ReminderValue } from "~/lib/consts/types";

const _leadTimeToDayjs = {
  "0D": [0, "day"],
  "1D": [1, "day"],
  "2D": [2, "day"],
  "3D": [3, "day"],
  "1W": [1, "week"],
  "2W": [2, "week"],
  "1M": [1, "month"],
  "3M": [3, "month"],
  "6M": [6, "month"],
} as const;

export const leadTimeToDayjs = (
  leadTime: ReminderValue
): [number, ManipulateType] => {
  const [value, unit] = _leadTimeToDayjs[leadTime];
  return [value, unit];
};

export const subtractLeadTime = (d: Dayjs, l: ReminderValue) => {
  const [value, unit] = leadTimeToDayjs(l);
  return d.subtract(value, unit);
};

export const addLeadTime = (d: Dayjs, l: ReminderValue) => {
  const [value, unit] = leadTimeToDayjs(l);
  return d.add(value, unit);
};

const _cycleUnitToDayjsUnit = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
} as const;

export const cycleUnitToDayjsUnit = (unit: CycleUnit): ManipulateType => {
  return _cycleUnitToDayjsUnit[unit];
};

export const addCycles = (d: Dayjs, cycle: Cycle, numCycles: number) => {
  return d.add(cycle.value * numCycles, cycleUnitToDayjsUnit(cycle.unit));
};
