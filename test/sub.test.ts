import dayjs from "dayjs";
import { describe, expect, test } from "vitest";
import { createCallerUser, createContrib, createSubData } from "./utils";

describe("subscriptions", () => {
  test("create sub", async () => {
    const { user, caller } = await createCallerUser();
    const id = await caller.sub.create(
      createSubData({
        value: 10,
        startDate: "2021-01-01",
        trial: { unit: "DAY", value: 1 },
        contribs: [createContrib(user.id, { paid: 10, owed: 0 })],
      }),
    );
    const sub = await caller.sub.get({ id });
    expect(sub.amount).toBe(10);
    expect(sub.startDate).toEqual(new Date("2021-01-02"));
  });

  test("update sub cycle and amount", async () => {
    const { user, caller } = await createCallerUser();
    const id = await caller.sub.create(
      createSubData({
        value: 10,
        contribs: [createContrib(user.id, { paid: 10, owed: 0 })],
      }),
    );

    await caller.sub.update({
      id,
      name: "updated sub",
      groupId: null,
      amount: 25,
      currencyCode: "USD",
      startDate: "2021-01-01",
      endDate: null,
      cycle: { unit: "WEEK", value: 2 },
      trial: null,
      contribs: [
        {
          userId: user.id,
          amountPaid: 25,
          amountOwed: 0,
          manualAmountOwed: false,
        },
      ],
    });

    const updated = await caller.sub.get({ id });
    expect(updated.amount).toBe(25);
    expect(updated.cycle.unit).toBe("WEEK");
    expect(updated.cycle.value).toBe(2);
    expect(updated.name).toBe("updated sub");
  });

  test("cancel sub sets endDate", async () => {
    const { user, caller } = await createCallerUser();
    const id = await caller.sub.create(
      createSubData({
        value: 10,
        startDate: "2021-01-01",
        contribs: [createContrib(user.id, { paid: 10, owed: 0 })],
      }),
    );

    await caller.sub.cancel({ id, endDate: "2025-12-31" });

    const cancelled = await caller.sub.get({ id });
    expect(cancelled.endDate).toEqual(new Date("2025-12-31"));
  });

  test("archive sub excludes from list", async () => {
    const { user, caller } = await createCallerUser();
    const id = await caller.sub.create(
      createSubData({
        value: 10,
        startDate: dayjs().subtract(2, "day").format("YYYY-MM-DD"),
        contribs: [createContrib(user.id, { paid: 10, owed: 0 })],
      }),
    );

    const before = await caller.user.start();
    expect(before.subscriptions.find((s) => s.id === id)).toBeDefined();

    await caller.sub.archive(id);

    const after = await caller.user.start();
    expect(after.subscriptions.find((s) => s.id === id)).toBeUndefined();
  });
});
