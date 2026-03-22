import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";
import { schema } from "~/server/db";
import {
  createCallerUser,
  createContrib,
  createSubData,
  createTxData,
  db,
} from "./utils";

describe("users and connections", () => {
  test("create contact, tx, check summary", async () => {
    const { user: user1, caller: caller1 } = await createCallerUser();
    const { user: user2, caller: caller2 } = await createCallerUser();

    await caller1.user.connect(user2.id);

    await caller1.tx.create(
      createTxData({
        value: 10,
        contributions: [
          createContrib(user1.id, { paid: 10, owed: 5 }),
          createContrib(user2.id, { paid: 0, owed: 5 }),
        ],
      }),
    );

    const { balances: balances1 } = await caller1.user.start();
    const balanceWithUser2 = balances1.find((b) => b.userId === user2.id);
    expect(balanceWithUser2?.amount).toBe(5);

    const { balances: balances2 } = await caller2.user.start();
    const balanceWithUser1 = balances2.find((b) => b.userId === user1.id);
    expect(balanceWithUser1?.amount).toBe(-5);
  });

  test("create contact, sub, check summary", async () => {
    const { user: user1, caller: caller1 } = await createCallerUser();
    const { user: user2, caller: caller2 } = await createCallerUser();

    await caller1.user.connect(user2.id);

    await caller1.sub.create(
      createSubData({
        value: 10,
        startDate: dayjs().subtract(2, "day").format("YYYY-MM-DD"),
        contribs: [
          createContrib(user1.id, { paid: 10, owed: 5 }),
          createContrib(user2.id, { paid: 0, owed: 5 }),
        ],
      }),
    );

    const { balances: balances1 } = await caller1.user.start();
    const balanceWithUser2 = balances1.find((b) => b.userId === user2.id);
    expect(balanceWithUser2?.amount).toBe(5);

    const { balances: balances2 } = await caller2.user.start();
    const balanceWithUser1 = balances2.find((b) => b.userId === user1.id);
    expect(balanceWithUser1?.amount).toBe(-5);
  });

  test("update user settings", async () => {
    const { user, caller } = await createCallerUser();

    await caller.user.update({ currencyCode: "EUR", hideBalance: true });

    const updated = await db.query.user.findFirst({
      where: eq(schema.user.id, user.id),
    });
    expect(updated?.currencyCode).toBe("EUR");
    expect(updated?.hideBalance).toBe(true);
  });

  test("set and retrieve nickname", async () => {
    const { caller: caller1 } = await createCallerUser();
    const { user: user2 } = await createCallerUser();

    await caller1.user.connect(user2.id);
    await caller1.user.updateNickname({ id: user2.id, nickname: "Bobby" });

    const { connections } = await caller1.user.start();
    const conn = connections.find((c) => c.id === user2.id);
    expect(conn?.nickname).toBe("Bobby");
  });
});
