import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { ReminderValue } from "~/lib/consts/types";
import { type MyContext } from "~/server/api/trpc";
import {
  db,
  schema,
  type DbCtx,
  type DbTxUserCtx,
  type DbUserCtx,
} from "~/server/db";
import type {
  InsertEvent,
  InsertSub,
  InsertSubContrib,
  SelectSubContrib,
} from "~/server/db/types";
import { type SubChangeset } from "~/server/resolver/contribs";

export type CreateSubParams = {
  sub: InsertSub;
  contribs: InsertSubContrib[];
};

export async function create(ctx: DbCtx, params: CreateSubParams) {
  await ctx.db.batch([
    ctx.db.insert(schema.subscription).values(params.sub),
    ctx.db.insert(schema.subContrib).values(params.contribs),
    ctx.db.insert(schema.event).values([
      {
        name: "sub_created",
        createdById: params.sub.createdById,
        subscriptionId: params.sub.id,
      },
      ...contribEvents({
        createdById: params.sub.createdById,
        subId: params.sub.id,
        contribs: params.contribs,
      }),
    ]),
  ]);
}

export type UpdateSubParams = {
  sub: Partial<InsertSub> & {
    startDate: string;
  };
  contribs: SubChangeset;
  isChanged: boolean;
};

export async function update(
  ctx: DbUserCtx,
  id: string,
  params: UpdateSubParams
) {
  await db.transaction(async (trx) => {
    if (params.isChanged) {
      await trx
        .update(schema.subscription)
        .set(params.sub)
        .where(eq(schema.subscription.id, id));
      await trx.insert(schema.event).values({
        name: "sub_updated",
        createdById: ctx.userId,
        subscriptionId: id,
      });
    }
    await applyChangeset(
      { userId: ctx.userId, db: trx },
      { id: id, startDate: params.sub.startDate },
      params.contribs
    );
  });
}

function contribEvents(params: {
  createdById: string;
  subId: string;
  contribs: Pick<InsertSubContrib, "userId" | "amountPaid" | "amountOwed">[];
}) {
  return params.contribs.reduce((acc, c) => {
    if (!c.userId) return acc;
    acc.push({
      name: "sub_joined",
      createdById: params.createdById,
      subscriptionId: params.subId,
      targetUserId: c.userId,
    });
    return acc;
  }, [] as InsertEvent[]);
}

interface CancelParams {
  id: string;
  endDate: string;
}

export async function cancel(ctx: DbUserCtx, params: CancelParams) {
  await db.batch([
    db
      .update(schema.subscription)
      .set({ endDate: params.endDate })
      .where(eq(schema.subscription.id, params.id)),
    db
      .update(schema.subContrib)
      .set({ reminderDate: null })
      .where(eq(schema.subContrib.subscriptionId, params.id)),
    db.insert(schema.event).values({
      name: "sub_cancelled",
      createdById: ctx.userId,
      subscriptionId: params.id,
    }),
  ]);
}

export async function archive(params: { id: string; callerUserId: string }) {
  await db.batch([
    db
      .update(schema.subscription)
      .set({
        archivedAt: sql`CURRENT_TIMESTAMP`,
        archivedById: params.callerUserId,
      })
      .where(eq(schema.subscription.id, params.id)),
    db
      .update(schema.subContrib)
      .set({ reminderDate: null })
      .where(eq(schema.subContrib.subscriptionId, params.id)),
    db.insert(schema.event).values({
      name: "sub_archived",
      createdById: params.callerUserId,
      subscriptionId: params.id,
    }),
  ]);
}

export function updateReminder(params: {
  contribId: string;
  reminderDate: string | null;
  reminder?: ReminderValue | null;
}) {
  return db
    .update(schema.subContrib)
    .set({
      reminderDate: params.reminderDate,
      reminder: params.reminder,
    })
    .where(eq(schema.subContrib.id, params.contribId));
}

export async function contribUpdateById(
  id: string,
  params: Partial<Omit<SelectSubContrib, "id">>
) {
  return db
    .update(schema.subContrib)
    .set(params)
    .where(eq(schema.subContrib.id, id));
}

/**
 * Confirms contributions for specific users.
 * Should only be used for confirming on successful notification.
 * Does not track event.
 */
export async function contribsConfirm(
  ctx: DbCtx,
  subId: string,
  userIds: string[]
) {
  if (userIds.length === 0) return;

  await ctx.db
    .update(schema.subContrib)
    .set({ status: "CONFIRMED" })
    .where(
      and(
        eq(schema.subContrib.subscriptionId, subId),
        inArray(schema.subContrib.userId, userIds)
      )
    );
}

export async function contribsChangeset(
  ctx: MyContext,
  params: {
    subId: string;
    subStartDate: string;
    changes: SubChangeset;
  }
) {
  await ctx.db.transaction(async (trx) => {
    await applyChangeset(
      { userId: ctx.userId, db: trx },
      { id: params.subId, startDate: params.subStartDate },
      params.changes
    );
  });
}

async function applyChangeset(
  ctx: DbTxUserCtx,
  sub: {
    id: string;
    startDate: string;
  },
  changes: SubChangeset
) {
  function eventToDbEvent(e: SubChangeset["events"][0]): InsertEvent {
    return {
      name: mapContribEventToEventName(e),
      createdById: ctx.userId,
      targetUserId: e.userId,
      subscriptionId: sub.id,
    };
  }

  if (changes.deletes.length > 0) {
    await ctx.db
      .delete(schema.subContrib)
      .where(
        and(
          eq(schema.subContrib.subscriptionId, sub.id),
          inArray(schema.subContrib.id, changes.deletes)
        )
      );
  }
  if (changes.updates.length > 0) {
    await Promise.all(
      changes.updates.map((update) =>
        ctx.db
          .update(schema.subContrib)
          .set(update)
          .where(eq(schema.subContrib.id, update.id))
      )
    );
  }
  if (changes.creates.length > 0) {
    await ctx.db.insert(schema.subContrib).values(
      changes.creates.map((v) => ({
        id: createId(),
        subscriptionId: sub.id,
        userId: v.userId,
        amountPaid: v.amountPaid,
        amountOwed: v.amountOwed,
        status: v.status ?? "NOT_DELIVERED",
        joinDate: sub.startDate,
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
  e: SubChangeset["events"][0]
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
