import { arrCombine } from "~/utils/array";

export interface UserBalance {
  userId: string;
  amount: number;
  currencyCode: string;
}

export function combineUserBalances(balances: UserBalance[][]): UserBalance[] {
  return arrCombine(
    balances,
    (v) => v.userId + v.currencyCode,
    (a, b) => ({ ...a, amount: a.amount + b.amount })
  );
}
