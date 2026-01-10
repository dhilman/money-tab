import { HEADER_TG_REFERRER, HEADER_TIMEZONE } from "~/lib/consts/headers";
import { calcRenewalDate, calcRenewalsPassed } from "~/lib/dates/subscription";
import { privateProcedure, type MyContext } from "~/server/api/trpc";
import { mutate, queries } from "~/server/db";
import type {
  InsertUser,
  SelectContrib,
  SelectSubComplete,
} from "~/server/db/types";
import { arrCombine } from "~/utils/array";

export const userStartHandler = privateProcedure.query(async ({ ctx }) => {
  const [txBalances, connectionsFrom, transactions, subs, groups] =
    await ctx.db.batch([
      queries.tx.balance(ctx, { userId: ctx.userId, fromDate: null }),
      queries.user.connections(ctx, ctx.userId),
      queries.tx.list(
        ctx,
        { userId: ctx.userId, limit: 10 },
        { contribs: true },
      ),
      queries.sub.list(ctx, { userId: ctx.userId }, { contribs: true }),
      queries.group.list(ctx, { userId: ctx.userId }, {}),
    ]);

  await updateUserWhenChanged(ctx);

  const subBalances = calcSubsTotals(ctx.userId, subs);
  const balances = arrCombine(
    [txBalances, subBalances],
    (v) => v.userId + v.currencyCode,
    (a, b) => ({ ...a, amount: a.amount + b.amount }),
  );

  const mostRecentContributorIds = transactions.reduce((acc, tx) => {
    const contribs = tx.contribs.filter((c) => c.userId !== ctx.userId);
    if (contribs.length === 0) return acc;
    for (const contrib of contribs) {
      if (!contrib.userId) continue;
      if (acc.includes(contrib.userId)) continue;
      acc.push(contrib.userId);
    }
    return acc;
  }, [] as string[]);

  const connections = connectionsFrom.map((v) => ({
    ...v.user,
    connected: true,
    nickname: v.nickname,
  }));

  // sort connections by index in mostRecentContributorIds
  connections.sort((a, b) => {
    const aIndex = mostRecentContributorIds.indexOf(a.id);
    const bIndex = mostRecentContributorIds.indexOf(b.id);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // TODO: need to store number of txs, subs created on user, then use that here
  function hasBeenCreator() {
    if (transactions.some((tx) => tx.createdById === ctx.userId)) return true;
    if (subs.some((sub) => sub.createdById === ctx.userId)) return true;
    return false;
  }

  return {
    user: ctx.user,
    hasBeenCreator: hasBeenCreator(),
    balances,
    connections: connections,
    groups: groups,
    transactions: transactions.slice(0, 10).map((t) => {
      return {
        ...t,
        net: calcTxNet(ctx.userId, t.contribs),
      };
    }),
    subscriptions: subs.map((s) => ({
      ...s,
      cycle: { unit: s.cycleUnit, value: s.cycleValue },
      renewalDate: calcRenewalDate({
        startDate: s.startDate,
        endDate: s.endDate,
        cycle: { unit: s.cycleUnit, value: s.cycleValue },
      })?.format("YYYY-MM-DD"),
    })),
  };
});

async function updateUserWhenChanged(ctx: MyContext) {
  const timezone = ctx.req.getHeader(HEADER_TIMEZONE);
  const referrer = ctx.req.getHeader(HEADER_TG_REFERRER);
  const updates: Partial<InsertUser> = {};

  const user = ctx.user;

  if (timezone && timezone !== user.timezone) {
    updates.timezone = timezone;
  }

  // only update referrer if it's not set and user has been created in the last 1 hour
  if (referrer && !user.referrer && user.referrer !== referrer) {
    const createdAt = new Date(user.createdAt);
    const now = new Date();
    const ONE_HOUR = 60 * 60 * 1000;
    if (now.getTime() - createdAt.getTime() < ONE_HOUR) {
      updates.referrer = referrer;
    }
  }

  if (Object.keys(updates).length > 0) {
    await mutate.user.updateById(ctx, ctx.userId, updates);
  }
}

function calcSubsTotals(callerUserId: string, subs: SelectSubComplete[]) {
  return subs.map((sub) => calcSubscriptionTotal(callerUserId, sub)).flat();
}

function calcSubscriptionTotal(callerUserId: string, sub: SelectSubComplete) {
  const cycles = calcRenewalsPassed({
    startDate: sub.startDate,
    endDate: sub.endDate,
    cycle: { unit: sub.cycleUnit, value: sub.cycleValue },
  });
  if (!cycles) return [];

  // Filter out contribs without userId
  const contribs = sub.contribs.filter((u) => u.userId);
  // Only caller contrib, so no need to calculate
  if (contribs.length < 2) return [];

  const callerContrib = contribs.find((u) => u.userId === callerUserId);
  const payerContrib = contribs.find((u) => u.amountPaid > 0);
  if (!payerContrib || !callerContrib) return [];

  if (payerContrib.userId !== callerUserId) {
    return [
      {
        userId: payerContrib.userId as string,
        amount: -callerContrib.amountOwed * cycles,
        currencyCode: sub.currencyCode,
      },
    ];
  }

  return contribs
    .filter((u) => u.userId !== callerUserId)
    .map((u) => ({
      userId: u.userId as string,
      amount: u.amountOwed * cycles,
      currencyCode: sub.currencyCode,
    }));
}

export const calcTxNet = (userId: string, contributions: SelectContrib[]) => {
  const contrib = contributions.find((c) => c.userId === userId);
  if (!contrib) return 0;
  if (contributions.length === 1) return -contrib.amountPaid;
  return contrib.amountPaid - contrib.amountOwed;
};
