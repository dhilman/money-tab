import dayjs from "dayjs";
import { migrate } from "drizzle-orm/libsql/migrator";
import type { NextApiResponse } from "next";
import { describe, expect, test } from "vitest";
import { createCaller } from "~/server/api/root";
import { db, mutate, type DbCtx } from "~/server/db";
import { mdb } from "~/server/monitor/mdb";
import { type RouterInputs } from "~/utils/api";
import type { IncomingRequest } from "~/utils/request";

await migrate(db, { migrationsFolder: "migrations/main" });
await migrate(mdb, { migrationsFolder: "migrations/monitor" });

const ctx: DbCtx = { db };

function randomTgId() {
  return Math.floor(Math.random() * 1000000);
}

async function createCallerUser() {
  const user = await mutate.user.create(ctx, {
    telegramId: randomTgId(),
    firstName: "John",
  });
  return {
    caller: createCaller({
      db,
      req: {
        cookie: "",
        getUrl: () => new URL("http://localhost:3000/"),
        getHeader: () => null,
      } as IncomingRequest,
      res: {} as NextApiResponse,
      userId: user.id,
      user: user,
    }),
    user,
  };
}

type TxCreateInput = RouterInputs["tx"]["create"];
type ContribInput = TxCreateInput["contributions"][0];
function createContrib(
  userId: string | null,
  opts: {
    paid?: number;
    owed?: number;
    manual?: boolean;
  } = {}
): ContribInput {
  return {
    userId,
    amountPaid: opts.paid ?? 0,
    amountOwed: opts.owed ?? 0,
    manualAmountOwed: opts.manual ?? false,
  };
}

function createTxData(input: Partial<TxCreateInput> = {}): TxCreateInput {
  return {
    value: 10,
    description: "test",
    currencyCode: "USD",
    date: null,
    groupId: null,
    files: [],
    contributions: [createContrib("", { paid: 10, owed: 0 })],
    ...input,
  };
}

type SubCreateInput = RouterInputs["sub"]["create"];
function createSubData(input: Partial<SubCreateInput> = {}): SubCreateInput {
  return {
    value: 10,
    name: "sub",
    currencyCode: "USD",
    cycle: {
      unit: "MONTH",
      value: 1,
    },
    startDate: "2021-01-01",
    trial: null,
    endDate: null,
    contribs: [createContrib("", { paid: 10, owed: 0 })],
    groupId: null,
    reminder: null,
    ...input,
  };
}

describe("txs, subs, summary", () => {
  test("create tx", async () => {
    const { user, caller } = await createCallerUser();
    const txId = await caller.tx.create(
      createTxData({
        value: 10,
        contributions: [createContrib(user.id, { paid: 10, owed: 0 })],
      })
    );
    const tx = await caller.tx.get({ id: txId });
    expect(tx.amount).toBe(10);
  });

  test("create sub", async () => {
    const { user, caller } = await createCallerUser();
    const id = await caller.sub.create(
      createSubData({
        value: 10,
        startDate: "2021-01-01",
        trial: { unit: "DAY", value: 1 },
        contribs: [createContrib(user.id, { paid: 10, owed: 0 })],
      })
    );
    const sub = await caller.sub.get({ id });
    expect(sub.amount).toBe(10);
    expect(sub.startDate).toBe("2021-01-02");
  });

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
      })
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
      })
    );

    const { balances: balances1 } = await caller1.user.start();
    const balanceWithUser2 = balances1.find((b) => b.userId === user2.id);
    expect(balanceWithUser2?.amount).toBe(5);

    const { balances: balances2 } = await caller2.user.start();
    const balanceWithUser1 = balances2.find((b) => b.userId === user1.id);
    expect(balanceWithUser1?.amount).toBe(-5);
  });
});

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
      })
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
});
