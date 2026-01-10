import dayjs, { type Dayjs } from "dayjs";
import { describe, expect, test } from "vitest";
import { type Cycle } from "~/lib/consts/types";
import { TEST_setNow } from "~/lib/dates/dates";
import {
  calcReminderDate,
  calcRenewalDate,
  calcRenewalDateAfter,
  calcRenewalDateAfterToday,
  calcRenewalsInRange,
  calcRenewalsPassed,
} from "~/lib/dates/subscription";

const CYCLES: Record<"DAY" | "WEEK" | "MONTH", Cycle> = {
  DAY: {
    unit: "DAY" as const,
    value: 1,
  },
  WEEK: {
    unit: "WEEK" as const,
    value: 1,
  },
  MONTH: {
    unit: "MONTH" as const,
    value: 1,
  },
};

function testWithNow(desc: string, fn: () => void, now?: Dayjs) {
  test(desc, () => {
    if (now) TEST_setNow(() => now);
    fn();
    if (now) TEST_setNow(() => dayjs(undefined, { utc: true }));
  });
}

describe("get next cycle date after", () => {
  const day = dayjs("2023-03-25");
  const testCases = [
    {
      desc: "start 1d ago, cycle 1d, after 1d ago, expect today",
      cycle: CYCLES.DAY,
      startDay: day.subtract(1, "day"),
      afterDay: day.subtract(1, "day"),
      expected: day,
    },
    {
      desc: "start 1d ago, cycle 1d, after tomorrow",
      cycle: CYCLES.DAY,
      startDay: day.subtract(1, "day"),
      afterDay: day.add(1, "minute"),
      expected: day.add(1, "day"),
    },
    {
      desc: "starts on 31st of Jan, expect 29th of Feb",
      cycle: CYCLES.MONTH,
      startDay: dayjs("2024-01-31"),
      afterDay: dayjs("2024-01-31"),
      expected: dayjs("2024-02-29"),
    },
    {
      desc: "starts on 31st of Jan, expect 31st of March",
      cycle: CYCLES.MONTH,
      startDay: dayjs("2024-01-31"),
      afterDay: dayjs("2024-03-01"),
      expected: dayjs("2024-03-31"),
    },
    {
      desc: "starts today, after tomorrow, expect tomorrow",
      cycle: CYCLES.DAY,
      startDay: day,
      afterDay: day.add(1, "day"),
      expected: day.add(1, "day"),
    },
  ];

  testCases.forEach((tc) => {
    testWithNow(
      tc.desc,
      () => {
        const res = calcRenewalDateAfter(
          {
            startDate: tc.startDay,
            endDate: null,
            cycle: tc.cycle,
          },
          tc.afterDay,
        );
        expect(res ? res.toISOString() : null).toEqual(
          tc.expected.toISOString(),
        );
      },
      day,
    );
  });
});

describe("client renewal", () => {
  const today = dayjs("2023-03-25");
  const testCases = [
    {
      desc: "started yesterday, cycle day, renews today",
      cycle: CYCLES.DAY,
      startDate: today.subtract(1, "day"),
      expected: today,
    },
    {
      desc: "started yesterday, cycle day, renews today (_today = midday)",
      cycle: CYCLES.DAY,
      startDate: today.subtract(1, "day"),
      expected: today,
      _today: today.add(12, "hour"),
    },
    {
      desc: "started two days ago, cycle day, renews today",
      cycle: CYCLES.DAY,
      startDate: today.subtract(2, "day"),
      expected: today,
    },
    {
      desc: "started yesterday, cycle week, renews in 6 days",
      cycle: CYCLES.WEEK,
      startDate: today.subtract(1, "day"),
      expected: today.add(6, "day"),
    },
    {
      desc: "starts today",
      cycle: CYCLES.DAY,
      startDate: today,
      expected: today,
    },
    {
      desc: "starts tomorrow",
      cycle: CYCLES.DAY,
      startDate: today.add(1, "day"),
      expected: today.add(1, "day"),
    },
    {
      desc: "started yesterday, cycle day, renews today, ends today",
      cycle: CYCLES.DAY,
      startDate: today.subtract(1, "day"),
      endDate: today,
      expected: null,
    },
    {
      desc: "started yesterday, cycle day, renews today, ends tomorrow",
      cycle: CYCLES.DAY,
      startDate: today.subtract(1, "day"),
      endDate: today.add(1, "day"),
      expected: today,
    },
  ];

  testCases.forEach((tc) => {
    testWithNow(
      tc.desc,
      () => {
        const res = calcRenewalDate({
          startDate: tc.startDate,
          endDate: tc.endDate ? tc.endDate : null,
          cycle: tc.cycle,
        });
        const want = tc.expected ? tc.expected.toISOString() : null;
        expect(res ? res.toISOString() : null).toEqual(want);
      },
      tc._today || today,
    );
  });
});

describe("server renewal", () => {
  const today = dayjs("2023-03-25");
  const testCases = [
    {
      desc: "starts today, cycle day, want tomorrow renewal",
      cycle: CYCLES.DAY,
      startDate: today,
      expected: today.add(1, "day"),
    },
    {
      desc: "started yesterday, cycle day, want tomorrow renewal",
      cycle: CYCLES.DAY,
      startDate: today.subtract(1, "day"),
      expected: today.add(1, "day"),
    },
    {
      desc: "started yesterday, cycle week",
      cycle: CYCLES.WEEK,
      startDate: today.subtract(1, "day"),
      expected: today.add(6, "day"),
    },
    {
      desc: "started 14 days ago, cycle week, want 1 week from today",
      cycle: CYCLES.WEEK,
      startDate: today.subtract(14, "day"),
      expected: today.add(7, "day"),
    },
    {
      desc: "started yesterday, cycle day, ends today",
      cycle: CYCLES.DAY,
      startDate: today.subtract(1, "day"),
      endDate: today,
      expected: null,
    },
    {
      desc: "started yesterday, cycle day, ends tomorrow",
      cycle: CYCLES.DAY,
      startDate: today.subtract(1, "day"),
      endDate: today.add(1, "day"),
      expected: null,
    },
  ];

  testCases.forEach((tc) => {
    testWithNow(
      tc.desc,
      () => {
        const res = calcRenewalDateAfterToday({
          startDate: tc.startDate,
          endDate: tc.endDate ? tc.endDate : null,
          cycle: tc.cycle,
        });
        const want = tc.expected ? tc.expected.toISOString() : null;
        expect(res ? res.toISOString() : null).toEqual(want);
      },
      today,
    );
  });
});

describe("number of cycles to date", () => {
  const today = dayjs("2023-03-25");
  const testCases = [
    {
      desc: "started today, 1D cycle, expect 1",
      cycle: CYCLES.DAY,
      startDate: today,
      expected: 1,
    },
    {
      desc: "started 1D ago, 1D cycle, expect 2",
      cycle: CYCLES.DAY,
      startDate: today.subtract(1, "day"),
      expected: 2,
    },
    {
      desc: "started 1D ago, 1D cycle, ends today, expect 1",
      cycle: CYCLES.DAY,
      startDate: today.subtract(1, "day"),
      endDate: today,
      expected: 1,
    },
    {
      desc: "started 6D ago, 1W cycle, expect 1",
      cycle: CYCLES.WEEK,
      startDate: today.subtract(6, "day"),
      expected: 1,
    },
    {
      desc: "starts in 1D, expect 0",
      cycle: CYCLES.DAY,
      startDate: today.add(1, "day"),
      expected: 0,
    },
    {
      desc: "started 1.5M ago, 1M cycle, expect 2",
      cycle: CYCLES.MONTH,
      startDate: today.subtract(40, "days"),
      expected: 2,
    },
  ];

  testCases.forEach((tc) => {
    testWithNow(
      tc.desc,
      () => {
        const res = calcRenewalsPassed({
          startDate: tc.startDate,
          endDate: tc.endDate ? tc.endDate : null,
          cycle: tc.cycle,
        });
        expect(res).toEqual(tc.expected);
      },
      today,
    );
  });
});

describe("calc num cycles in range", () => {
  const testCases = [
    {
      desc: "from=start, to=start+31D, cycle day, expect 30",
      startDate: "2023-01-01",
      endDate: null,
      cycle: CYCLES.DAY,
      fromDate: "2023-01-01",
      toDate: "2023-01-31",
      expected: 30,
    },
    {
      desc: "from=start-1, to=start+31D, cycle day, expect 30",
      startDate: "2023-01-01",
      endDate: null,
      cycle: CYCLES.DAY,
      fromDate: "2022-12-31",
      toDate: "2023-01-31",
      expected: 30,
    },
    {
      desc: "from=start-2, to=start-1, cycle day, expect 0",
      startDate: "2023-01-01",
      endDate: null,
      cycle: CYCLES.DAY,
      fromDate: "2022-12-30",
      toDate: "2022-12-31",
      expected: 0,
    },
    {
      desc: "from=start, to=start+40D, ends=start+31D, cycle day, expect 30",
      startDate: "2023-01-01",
      endDate: "2023-01-31",
      cycle: CYCLES.DAY,
      fromDate: "2023-01-01",
      toDate: "2023-02-10",
      expected: 30,
    },
    {
      desc: "from=start+5D, to=start+30D, cycle day, expect 25",
      startDate: "2023-01-01",
      endDate: null,
      cycle: CYCLES.DAY,
      fromDate: "2023-01-06",
      toDate: "2023-01-31",
      expected: 25,
    },
    {
      desc: "from=start-1D, to=start+1D, cycle week, expect 1",
      startDate: "2023-01-01",
      endDate: null,
      cycle: CYCLES.WEEK,
      fromDate: "2022-12-31",
      toDate: "2023-01-02",
      expected: 1,
    },
    {
      desc: "from=start+12D, to=start+16D, cycle week, expect 1",
      startDate: "2023-01-01",
      endDate: null,
      cycle: CYCLES.WEEK,
      fromDate: "2023-01-13",
      toDate: "2023-01-17",
      expected: 1,
    },
    {
      desc: "start=5 April, from=21 May, to=1 June, cycle month, expect 0",
      startDate: "2023-04-05",
      endDate: null,
      cycle: CYCLES.MONTH,
      fromDate: "2023-05-21",
      toDate: "2023-06-01",
      expected: 0,
    },
    {
      desc: "start=1 may, from=21 may, to=1 june, cycle week, expect 2",
      startDate: "2023-05-01",
      endDate: null,
      cycle: CYCLES.WEEK,
      fromDate: "2023-05-21",
      toDate: "2023-06-01",
      expected: 2,
    },
  ];

  testCases.forEach((tc) => {
    test(tc.desc, () => {
      const res = calcRenewalsInRange(
        {
          startDate: tc.startDate,
          endDate: tc.endDate,
          cycle: tc.cycle,
        },
        {
          start: tc.fromDate,
          end: tc.toDate,
        },
      );
      expect(res).toEqual(tc.expected);
    });
  });
});

describe("reminder", () => {
  const today = dayjs("2023-03-25");
  const testCases = [
    {
      desc: "starts today, 1D cycle, reminder 0D, expect tomorrow",
      startDate: today,
      reminder: "0D" as const,
      cycle: CYCLES.DAY,
      expected: today.add(1, "day"),
    },
    {
      desc: "starts today, 1D cycle, reminder 0D, expect tomorrow (_today = midday)",
      startDate: today,
      reminder: "0D" as const,
      cycle: CYCLES.DAY,
      expected: today.add(1, "day"),
      _today: today.add(12, "hour"),
    },
    {
      desc: "starts today, 1D cycle, reminder 1D, expect tomorrow (for next renewal)",
      startDate: today,
      reminder: "1D" as const,
      cycle: CYCLES.DAY,
      expected: today.add(1, "day"),
    },
    {
      desc: "starts today, 1D cycle, reminder 0D, ends tomorrow, expect null",
      startDate: today,
      reminder: "0D" as const,
      cycle: CYCLES.DAY,
      endDate: today.add(1, "day"),
      expected: null,
    },
    {
      desc: "starts tomorrow, 1D cycle, reminder 0D, expect tomorrow",
      startDate: today.add(1, "day"),
      reminder: "0D" as const,
      cycle: CYCLES.DAY,
      expected: today.add(1, "day"),
    },
    {
      desc: "starts tomorrow, 1D cycle, reminder 1D, expect tomorrow (next renewal)",
      startDate: today.add(1, "day"),
      reminder: "1D" as const,
      cycle: CYCLES.DAY,
      expected: today.add(1, "day"),
    },
    {
      desc: "starts tomorrow, 1D cycle, reminder 2D, expect null (exceeds frequency)",
      startDate: today.add(1, "day"),
      reminder: "2D" as const,
      cycle: CYCLES.DAY,
      expected: null,
    },
    {
      desc: "start=25 Apr, cycle=1M, reminder=3D, today=22 May, expect 22 June",
      startDate: dayjs("2023-04-25"),
      reminder: "3D" as const,
      cycle: CYCLES.MONTH,
      expected: dayjs("2023-06-22"),
      _today: dayjs("2023-05-22T12:00:00"),
    },
  ];

  testCases.forEach((tc) => {
    testWithNow(
      tc.desc,
      () => {
        const res = calcReminderDate(
          {
            startDate: tc.startDate,
            endDate: tc.endDate ? tc.endDate : null,
            cycle: tc.cycle,
          },
          tc.reminder,
        );
        const want = tc.expected ? tc.expected.toISOString() : null;
        expect(res ? res.toISOString() : null).toEqual(want);
      },
      tc._today || today,
    );
  });
});
