import { describe, expect, test } from "vitest";
import { createCallerUser, createContrib, createTxData } from "./utils";

describe("transactions", () => {
  test("create tx", async () => {
    const { user, caller } = await createCallerUser();
    const txId = await caller.tx.create(
      createTxData({
        value: 10,
        contributions: [createContrib(user.id, { paid: 10, owed: 0 })],
      }),
    );
    const tx = await caller.tx.get({ id: txId });
    expect(tx.amount).toBe(10);
  });

  test("create tx with date", async () => {
    const { user, caller } = await createCallerUser();
    const txId = await caller.tx.create(
      createTxData({
        value: 10,
        date: "2024-06-15",
        contributions: [createContrib(user.id, { paid: 10, owed: 0 })],
      }),
    );
    const tx = await caller.tx.get({ id: txId });
    expect(tx.txDate).toEqual(new Date("2024-06-15"));
    expect(tx.txTime).toBeNull();
  });

  test("update tx amount and contributions", async () => {
    const { user, caller } = await createCallerUser();
    const txId = await caller.tx.create(
      createTxData({
        value: 10,
        contributions: [createContrib(user.id, { paid: 10, owed: 0 })],
      }),
    );

    await caller.tx.update({
      id: txId,
      amount: 20,
      currencyCode: "USD",
      description: "updated",
      groupId: null,
      date: null,
      contribs: [
        {
          userId: user.id,
          amountPaid: 20,
          amountOwed: 0,
          manualAmountOwed: false,
        },
      ],
      files: [],
    });

    const updated = await caller.tx.get({ id: txId });
    expect(updated.amount).toBe(20);
    expect(updated.description).toBe("updated");
    const userContrib = updated.contribs.find((c) => c.userId === user.id);
    expect(userContrib?.amountPaid).toBe(20);
  });

  test("archive and list archived txs", async () => {
    const { user, caller } = await createCallerUser();
    const txId = await caller.tx.create(
      createTxData({
        value: 10,
        contributions: [createContrib(user.id, { paid: 10, owed: 0 })],
      }),
    );

    await caller.tx.archive(txId);

    const { txs: active } = await caller.tx.list({ archived: false });
    expect(active.find((t) => t.id === txId)).toBeUndefined();

    const { txs: archived } = await caller.tx.list({ archived: true });
    expect(archived.find((t) => t.id === txId)).toBeDefined();
  });

  test("list txs between two users", async () => {
    const { user: user1, caller: caller1 } = await createCallerUser();
    const { user: user2 } = await createCallerUser();

    await caller1.user.connect(user2.id);

    const sharedTxId = await caller1.tx.create(
      createTxData({
        value: 20,
        contributions: [
          createContrib(user1.id, { paid: 20, owed: 10 }),
          createContrib(user2.id, { paid: 0, owed: 10 }),
        ],
      }),
    );

    // Solo tx — only user1
    await caller1.tx.create(
      createTxData({
        value: 5,
        contributions: [createContrib(user1.id, { paid: 5, owed: 0 })],
      }),
    );

    const { txs } = await caller1.tx.listWithUser({ userId: user2.id });
    expect(txs).toHaveLength(1);
    expect(txs[0]?.id).toBe(sharedTxId);
  });

  test("balance with multiple currencies", async () => {
    const { user: user1, caller: caller1 } = await createCallerUser();
    const { user: user2 } = await createCallerUser();

    await caller1.user.connect(user2.id);

    await caller1.tx.create(
      createTxData({
        value: 10,
        currencyCode: "USD",
        contributions: [
          createContrib(user1.id, { paid: 10, owed: 5 }),
          createContrib(user2.id, { paid: 0, owed: 5 }),
        ],
      }),
    );

    await caller1.tx.create(
      createTxData({
        value: 20,
        currencyCode: "EUR",
        contributions: [
          createContrib(user1.id, { paid: 20, owed: 10 }),
          createContrib(user2.id, { paid: 0, owed: 10 }),
        ],
      }),
    );

    const { balances } = await caller1.user.start();
    const usdBalance = balances.find(
      (b) => b.userId === user2.id && b.currencyCode === "USD",
    );
    const eurBalance = balances.find(
      (b) => b.userId === user2.id && b.currencyCode === "EUR",
    );
    expect(usdBalance?.amount).toBe(5);
    expect(eurBalance?.amount).toBe(10);
  });
});
