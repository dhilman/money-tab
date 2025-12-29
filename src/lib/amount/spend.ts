import type { Cycle } from "~/lib/consts/types";
import type { AnyDate, DateRange } from "~/lib/dates/dates";
import { calcRenewalsInRange } from "~/lib/dates/subscription";

interface Subscription {
  id: string;
  startDate: AnyDate;
  endDate: AnyDate | null;
  cycle: Cycle;
  amount: number;
}

export function calcSubsTotalSpend(subs: Subscription[], dates: DateRange) {
  let total = 0;
  const renewingIds: string[] = [];

  for (const sub of subs) {
    const renewals = calcRenewalsInRange(sub, dates);
    if (renewals === 0) continue;
    total += renewals * sub.amount;
    renewingIds.push(sub.id);
  }

  return { total, renewingIds };
}

interface Transaction {
  type: "PAYMENT" | "SETTLE";
  contribs: {
    userId: string | null;
    amountPaid: number;
    amountOwed: number;
  }[];
}

export function calcTxSpend(userId: string, tx: Transaction) {
  // If SETTLE, we don't count it as spending
  if (tx.type === "SETTLE") return 0;
  // For PAYMENT, just use amountOwed
  const contrib = tx.contribs.find((c) => c.userId === userId);
  if (!contrib) return 0;
  return contrib.amountOwed;
}
