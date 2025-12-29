import { createId } from "@paralleldrive/cuid2";
import { exit } from "process";
import { env } from "~/env.mjs";
import { splitAmount } from "~/lib/amount/split-amount";
import { db, mutate, schema } from "~/server/db";

async function createTx(params: {
  amount: number;
  paidByUserId: string;
  paidForUserIds: string[];
  currency?: string;
}) {
  const currency = params.currency || "XXX";
  const txId = createId();
  await db.insert(schema.transaction).values({
    id: txId,
    type: "PAYMENT",
    amount: params.amount,
    createdById: params.paidByUserId,
    currencyCode: currency,
  });

  const amounts = splitAmount(params.amount, params.paidForUserIds.length);
  const contribs = params.paidForUserIds.map((userId, i) => ({
    id: createId(),
    transactionId: txId,
    userId,
    amountOwed: amounts[i]!,
    amountPaid: 0,
    status: "CONFIRMED" as const,
  }));
  await db.insert(schema.contribution).values([
    {
      id: createId(),
      transactionId: txId,
      userId: params.paidByUserId,
      amountPaid: params.amount,
      amountOwed: 0,
      status: "CONFIRMED",
    },
    ...contribs,
  ]);
}

async function upsertConnections(userId: string, userIds: string[]) {
  for (const otherUserId of userIds) {
    const ctx = { db, userId };
    await mutate.contact.upsert(ctx, otherUserId);
  }
}

async function createManyTxs(params: {
  n: number;
  userIds: string[];
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
}) {
  const minAmount = params.minAmount || 100;
  const maxAmount = params.maxAmount || 1000;

  if (params.userIds.length < 2) {
    throw new Error("Must have at least 2 users");
  }

  // upsert connections between all users
  await Promise.all(
    params.userIds.map(
      async (userId, i) =>
        await upsertConnections(userId, params.userIds.slice(i + 1))
    )
  );

  for (let i = 0; i < params.n; i++) {
    const paidByUserId =
      params.userIds[Math.floor(Math.random() * params.userIds.length)]!;
    const paidForUserIds = params.userIds.filter((id) => id !== paidByUserId);
    const amount =
      Math.floor(Math.random() * (maxAmount - minAmount)) + minAmount;
    await createTx({
      amount,
      paidByUserId,
      paidForUserIds,
      currency: params.currency,
    });
  }
}

async function main() {
  if (!env.DATABASE_URL.includes("localhost")) {
    throw new Error("This script can only be run on the local database");
  }

  const config = {
    n_users: 100,
    n_txs_per_user: 100,
    n_users_per_tx: 4,
  };
  const users = Array.from({ length: config.n_users }, (_, i) => ({
    id: createId(),
    telegramId: 100 + i,
    username: `user${i}`,
  }));
  await db.insert(schema.user).values(users);
  console.log(`Created ${config.n_users} users`);

  const userIds = users.map((u) => u.id);

  let txsCreated = 0;
  for (let i = 0; i < config.n_users - 1; i++) {
    const targetUserIds = userIds.slice(i, i + config.n_users_per_tx);
    await createManyTxs({
      n: config.n_txs_per_user,
      userIds: targetUserIds,
      minAmount: 100,
      maxAmount: 1000,
    });
    txsCreated += config.n_txs_per_user;
  }
  console.log(`Created ${txsCreated} txs`);
}

await main();
exit(0);
