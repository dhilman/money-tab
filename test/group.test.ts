import { describe, expect, test } from "vitest";
import { createCallerUser, createContrib, createTxData } from "./utils";

describe("creating and transacting in a group", async () => {
  const { user: user1, caller: caller1 } = await createCallerUser();
  const { user: user2, caller: caller2 } = await createCallerUser();
  const group = await caller1.group.create({
    colorId: 1,
    name: "test",
    members: [user1.id],
  });

  test("join group", async () => {
    await caller2.group.join(group.id);

    const groups = await caller1.group.list();
    expect(groups).toHaveLength(1);
    expect(groups?.[0]?.members).toHaveLength(2);
  });

  test("create tx in group", async () => {
    const txId = await caller1.tx.create(
      createTxData({
        value: 10,
        groupId: group.id,
        contributions: [
          createContrib(user1.id, { paid: 10, owed: 5 }),
          createContrib(user2.id, { paid: 0, owed: 5 }),
        ],
      }),
    );

    const tx = await caller1.tx.get({ id: txId });
    expect(tx.groupId).toBe(group.id);
    expect(tx.amount).toBe(10);

    const { balances } = await caller1.user.start();
    const balanceWithUser2 = balances.find((b) => b.userId === user2.id);
    expect(balanceWithUser2?.amount).toBe(5);
  });

  test("settle with group member (even though not contact)", async () => {
    await caller1.tx.settle({
      userId: user2.id,
      amount: 5,
      currencyCode: "USD",
    });

    const { balances } = await caller1.user.start();
    const balanceWithUser2 = balances.find((b) => b.userId === user2.id);
    expect(balanceWithUser2?.amount).toBe(0);
  });

  test("list txs in group", async () => {
    const { txs } = await caller1.tx.listWithGroup({ groupId: group.id });
    expect(txs.length).toBeGreaterThanOrEqual(1);
    expect(txs.every((t) => t.groupId === group.id)).toBe(true);
  });
});
