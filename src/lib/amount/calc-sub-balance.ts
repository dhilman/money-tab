import { combineUserBalances, type UserBalance } from "~/lib/amount/balance";
import type { Cycle } from "~/lib/consts/types";
import type { AnyDate } from "~/lib/dates/dates";
import {
  calcRenewalsInRange,
  calcRenewalsPassed,
} from "~/lib/dates/subscription";

interface Subscription {
  id: string;
  currencyCode: string;
  startDate: AnyDate;
  endDate: AnyDate | null;
  cycle: Cycle;
  contribs: {
    userId: string | null;
    amountPaid: number;
    amountOwed: number;
  }[];
}

interface CalcSubParams {
  userId: string;
  fromDate?: AnyDate | null;
  toDate: AnyDate;
}

export function calcSubsSpend(subs: Subscription[], params: CalcSubParams) {
  return subs.reduce(
    (acc, sub) => {
      const contrib = sub.contribs.find((c) => c.userId === params.userId);
      if (!contrib) return acc;
      if (!contrib.amountOwed) return acc;

      const renewals = calcNumCycles(sub, params);
      if (!renewals) return acc;

      const amount = contrib.amountOwed * renewals;
      acc.push({ id: sub.id, amount, currencyCode: sub.currencyCode });
      return acc;
    },
    [] as { id: string; amount: number; currencyCode: string }[],
  );
}

export function calcSubsUserBalances(
  subs: Subscription[],
  params: CalcSubParams,
): UserBalance[] {
  return combineUserBalances(
    subs.map((sub) => calcSubUserBalances(sub, params)),
  );
}

function calcSubUserBalances(
  sub: Subscription,
  params: CalcSubParams,
): UserBalance[] {
  const cycles = calcNumCycles(sub, params);
  if (!cycles) return [];

  const contribs = sub.contribs.filter((u) => u.userId);
  if (contribs.length < 2) return [];

  const targetContrib = contribs.find((u) => u.userId === params.userId);
  const payerContrib = contribs.find((u) => u.amountPaid > 0);
  if (!targetContrib || !payerContrib) return [];

  if (payerContrib?.userId !== params.userId) {
    return [
      {
        userId: payerContrib.userId as string,
        amount: -targetContrib.amountOwed * cycles,
        currencyCode: sub.currencyCode,
      },
    ];
  }

  return contribs
    .filter((u) => u.userId !== params.userId)
    .map((u) => ({
      userId: u.userId as string,
      amount: u.amountOwed * cycles,
      currencyCode: sub.currencyCode,
    }));
}

function calcNumCycles(sub: Subscription, params: CalcSubParams) {
  if (params.fromDate) {
    return calcRenewalsInRange(sub, {
      start: params.fromDate,
      end: params.toDate,
    });
  } else {
    return calcRenewalsPassed(sub, params.toDate);
  }
}
