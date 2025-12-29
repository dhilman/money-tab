import dayjs from "dayjs";
import { describe, expect, test } from "vitest";
import { TEST_setNow } from "~/lib/dates/dates";
import { isReminderDue } from "~/lib/dates/reminder";

describe("is reminder due", () => {
  const testCases = [
    {
      desc: "reminder today, now 1am UTC, expect false",
      reminderDate: "2023-03-25",
      timezone: "UTC",
      _now: "2023-03-25T01:00:00Z",
      expected: false,
    },
    {
      desc: "reminder today, now 1pm UTC, expect true",
      reminderDate: "2023-03-25",
      timezone: "UTC",
      _now: "2023-03-25T13:00:00Z",
      expected: true,
    },
    {
      desc: "reminder today, now 2pm UTC, expect true",
      reminderDate: "2023-03-25",
      timezone: "UTC",
      _now: "2023-03-25T14:00:00Z",
      expected: true,
    },
    {
      desc: "reminder yesterday, now 1am UTC, expect true",
      reminderDate: "2023-03-24",
      timezone: "UTC",
      _now: "2023-03-25T01:00:00Z",
      expected: true,
    },
    {
      desc: "reminder today, now 1am UTC+12, expect true",
      reminderDate: "2023-03-25",
      timezone: "Pacific/Auckland",
      _now: "2023-03-25T01:00:00Z",
      expected: true,
    },
    {
      desc: "reminder today, now 1pm UTC+12, expect true",
      reminderDate: "2023-03-25",
      timezone: "Pacific/Auckland",
      _now: "2023-03-25T01:00:00Z",
      expected: true,
    },
    {
      desc: "reminder today, now 1pm UTC-11, expect false",
      reminderDate: "2023-03-25",
      timezone: "Pacific/Midway",
      _now: "2023-03-25T13:00:00Z",
      expected: false,
    },
    {
      desc: "reminder today, now 23:59 UTC-11, expect false",
      reminderDate: "2023-03-25",
      timezone: "Pacific/Midway",
      _now: "2023-03-25T23:59:00Z",
      expected: false,
    },
    {
      desc: "reminder today, now 00:00 UTC-11, expect true",
      reminderDate: "2023-03-25",
      timezone: "Pacific/Midway",
      _now: "2023-03-26T00:00:00Z",
      expected: true,
    },
  ];

  testCases.forEach((tc) => {
    test(tc.desc, () => {
      TEST_setNow(() => dayjs(tc._now));
      const res = isReminderDue(tc);
      expect(res).toEqual(tc.expected);
      TEST_setNow(() => dayjs());
    });
  });
});
