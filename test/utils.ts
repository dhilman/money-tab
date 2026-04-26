import type { NextApiResponse } from "next";
import { createCaller } from "~/server/api/root";
import { db, mutate, type DbCtx } from "~/server/db";
import type { RouterInputs } from "~/utils/api";
import type { IncomingRequest } from "~/utils/request";

export { db, mutate };
export const ctx: DbCtx = { db };

export function randomTgId() {
  return Math.floor(Math.random() * 1000000);
}

export async function createCallerUser() {
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
export function createContrib(
  userId: string | null,
  opts: {
    paid?: number;
    owed?: number;
    manual?: boolean;
  } = {},
): ContribInput {
  return {
    userId,
    amountPaid: opts.paid ?? 0,
    amountOwed: opts.owed ?? 0,
    manualAmountOwed: opts.manual ?? false,
  };
}

export function createTxData(
  input: Partial<TxCreateInput> = {},
): TxCreateInput {
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
export function createSubData(
  input: Partial<SubCreateInput> = {},
): SubCreateInput {
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
