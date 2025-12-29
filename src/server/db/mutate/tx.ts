import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  schema,
  type DbCtx,
  type DbTxUserCtx,
  type DbUserCtx,
} from "~/server/db";
import type {
  InsertContrib,
  InsertEvent,
  InsertFile,
  InsertTx,
} from "~/server/db/types";
import type { Changeset } from "~/server/resolver/array-resolver";
import type { TxChangeset } from "~/server/resolver/contribs";

export type CreateTxParams = {
  tx: InsertTx;
  contribs: InsertContrib[];
  files: InsertFile[];
};

export async function createV1(ctx: DbCtx, params: CreateTxParams) {
  await ctx.db.batch([
    ctx.db.insert(schema.transaction).values(params.tx),
    ctx.db.insert(schema.contribution).values(params.contribs),
    ...params.files.map((f) => ctx.db.insert(schema.file).values(f)),
    ctx.db.insert(schema.event).values([
      {
        name: "tx_created",
        createdById: params.tx.createdById,
        transactionId: params.tx.id,
      },
      ...contribEvents({
        createdById: params.tx.createdById,
        txId: params.tx.id,
        contribs: params.contribs,
      }),
    ]),
  ]);
}

function contribEvents(params: {
  createdById: string;
  txId: string;
  contribs: Pick<InsertContrib, "userId" | "amountPaid" | "amountOwed">[];
}) {
  return params.contribs.reduce((acc, c) => {
    if (!c.userId) return acc;
    acc.push({
      name: "tx_joined",
      createdById: params.createdById,
      transactionId: params.txId,
      targetUserId: c.userId,
    });
    return acc;
  }, [] as InsertEvent[]);
}

/**
 * Confirms contributions for specific users.
 * Should only be used for confirming on successful notification.
 * Does not track event.
 */
export async function contribsConfirm(
  ctx: DbCtx,
  txId: string,
  userIds: string[]
) {
  if (userIds.length === 0) return;

  await ctx.db
    .update(schema.contribution)
    .set({
      status: "CONFIRMED",
    })
    .where(
      and(
        eq(schema.contribution.transactionId, txId),
        inArray(schema.contribution.userId, userIds)
      )
    );
}

export interface UpdateTxParams {
  tx: Partial<InsertTx>;
  contribs: TxChangeset;
  files: Changeset<InsertFile>;
  isChanged: boolean;
}

export async function update(
  ctx: DbUserCtx,
  id: string,
  update: UpdateTxParams
) {
  await ctx.db.transaction(async (trx) => {
    if (update.isChanged) {
      await trx
        .update(schema.transaction)
        .set({ ...update.tx })
        .where(eq(schema.transaction.id, id));
      await trx.insert(schema.event).values({
        name: "tx_updated",
        createdById: ctx.userId,
        transactionId: id,
      });
    }
    const trxCtx = { ...ctx, db: trx };
    await applyChangeset(trxCtx, id, update.contribs);
    await applyFilesChangeset(trxCtx, id, update.files);
  });
}

export async function archive(ctx: DbUserCtx, id: string) {
  await ctx.db.batch([
    ctx.db
      .update(schema.transaction)
      .set({
        archivedAt: sql`CURRENT_TIMESTAMP`,
        archivedById: ctx.userId,
      })
      .where(eq(schema.transaction.id, id)),
    ctx.db.insert(schema.event).values({
      name: "tx_archived",
      createdById: ctx.userId,
      transactionId: id,
    }),
  ]);
}

export async function contribsChangeset(
  ctx: DbUserCtx,
  txId: string,
  changes: TxChangeset
) {
  await ctx.db.transaction(async (trx) => {
    await applyChangeset({ ...ctx, db: trx }, txId, changes);
  });
}

async function applyFilesChangeset(
  ctx: DbTxUserCtx,
  txId: string,
  changes: Changeset<InsertFile>
) {
  if (changes.deletes.length > 0) {
    await ctx.db
      .delete(schema.file)
      .where(
        and(
          eq(schema.file.transactionId, txId),
          inArray(schema.file.id, changes.deletes)
        )
      );
  }
  if (changes.creates.length > 0) {
    await ctx.db.insert(schema.file).values(changes.creates);
  }
}

async function applyChangeset(
  ctx: DbTxUserCtx,
  txId: string,
  changes: TxChangeset
) {
  function eventToDbEvent(e: TxChangeset["events"][0]): InsertEvent {
    return {
      name: mapContribEventToEventName(e),
      createdById: ctx.userId,
      targetUserId: e.userId,
      transactionId: txId,
    };
  }

  if (changes.deletes.length > 0) {
    await ctx.db
      .delete(schema.contribution)
      .where(
        and(
          eq(schema.contribution.transactionId, txId),
          inArray(schema.contribution.id, changes.deletes)
        )
      );
  }
  if (changes.updates.length > 0) {
    await Promise.all(
      changes.updates.map((update) =>
        ctx.db
          .update(schema.contribution)
          .set(update)
          .where(eq(schema.contribution.id, update.id))
      )
    );
  }
  if (changes.creates.length > 0) {
    await ctx.db.insert(schema.contribution).values(
      changes.creates.map((v) => ({
        id: createId(),
        transactionId: txId,
        userId: v.userId,
        amountPaid: v.amountPaid,
        amountOwed: v.amountOwed,
        status: v.status ?? "NOT_DELIVERED",
      }))
    );
  }
  if (changes.events.length > 0) {
    await ctx.db
      .insert(schema.event)
      .values(changes.events.map((e) => eventToDbEvent(e)));
  }
}

function mapContribEventToEventName(
  e: TxChangeset["events"][0]
): InsertEvent["name"] {
  switch (e.type) {
    case "leave":
      return "tx_left";
    case "join":
      return "tx_joined";
    case "amount_update":
      return "amount_updated";
  }
}
