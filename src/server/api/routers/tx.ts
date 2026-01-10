import { z } from "zod";
import { txArchiveHandler } from "~/server/api/handlers/tx/tx-archive";
import { txCreatehandler } from "~/server/api/handlers/tx/tx-create";
import { txGetHandler } from "~/server/api/handlers/tx/tx-get";
import { txJoinHandler } from "~/server/api/handlers/tx/tx-join";
import { txLeaveHandler } from "~/server/api/handlers/tx/tx-leave";
import { txSettleHandler } from "~/server/api/handlers/tx/tx-settle";
import { txUpdateHandler } from "~/server/api/handlers/tx/tx-update";
import { calcTxNet } from "~/server/api/handlers/user/user-start";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { queries } from "~/server/db";
import { SelectUserColumns } from "~/server/db/queries/user";
import type { SelectContrib } from "~/server/db/types";

export const txRouter = createTRPCRouter({
  list: privateProcedure
    .input(
      z.object({
        archived: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx }) => {
      const txs = await queries.tx.list(
        ctx,
        {
          userId: ctx.userId,
          limit: 250,
        },
        { contribs: true },
      );

      return {
        txs: txs.map((t) => ({
          ...t,
          net: calcTxNet(ctx.userId, t.contribs),
        })),
      };
    }),
  listWithUser: privateProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const txs = await queries.tx.list(
        ctx,
        {
          userIds: [ctx.userId, input.userId],
          limit: 10,
          archived: false,
        },
        { contribs: true },
      );

      return {
        txs: txs.map((t) => {
          return {
            ...t,
            participants: t.contribs.length,
            net: calcTxNetForUser({
              callerUserId: ctx.userId,
              userId: input.userId,
              contributions: t.contribs,
            }),
          };
        }),
      };
    }),
  listWithGroup: privateProcedure
    .input(
      z.object({
        groupId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const txs = await queries.tx.list(
        ctx,
        {
          groupId: input.groupId,
          limit: 10,
        },
        {
          contribs: { with: { user: SelectUserColumns } },
        },
      );

      return {
        txs: txs.map((t) => ({
          ...t,
          net: calcTxNet(ctx.userId, t.contribs),
        })),
      };
    }),
  get: txGetHandler,
  join: txJoinHandler,
  leave: txLeaveHandler,
  archive: txArchiveHandler,
  create: txCreatehandler,
  update: txUpdateHandler,
  settle: txSettleHandler,
});

const calcTxNetForUser = (params: {
  callerUserId: string;
  userId: string;
  contributions: SelectContrib[];
}) => {
  const callerContrib = params.contributions.find(
    (c) => c.userId === params.callerUserId,
  );
  if (!callerContrib) return 0;
  if (callerContrib.amountPaid === 0) return -callerContrib.amountOwed;

  const contrib = params.contributions.find((c) => c.userId === params.userId);
  if (!contrib) return 0;

  return contrib.amountOwed;
};
