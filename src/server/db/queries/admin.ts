import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gt,
  inArray,
  lt,
  sql,
} from "drizzle-orm";
import type { EventName } from "~/lib/consts/constants";
import { db, schema } from "~/server/db";

interface DateRangeParams {
  startDate: string;
  endDate: string;
}

interface UsersListParams {
  pageIndex: number;
  pageSize: number;
}

export function users(params: UsersListParams) {
  return db
    .select({
      id: schema.user.id,
      telegramId: schema.user.telegramId,
      firstName: schema.user.firstName,
      lastName: schema.user.lastName,
      username: schema.user.username,
      photoUrl: schema.user.photoUrl,
      accentColorId: schema.user.accentColorId,
      createdAt: schema.user.createdAt,
      referrer: schema.user.referrer,
      timezone: schema.user.timezone,
      languageCode: schema.user.languageCode,
      isRegistered: schema.user.isRegistered,
      tgIsPremium: schema.user.tgIsPremium,
      txs: countDistinct(schema.contribution.id),
      subs: countDistinct(schema.subContrib.id),
      contacts: countDistinct(schema.connection.userId),
    })
    .from(schema.user)
    .leftJoin(schema.connection, eq(schema.connection.ownerId, schema.user.id))
    .leftJoin(
      schema.contribution,
      eq(schema.contribution.userId, schema.user.id),
    )
    .leftJoin(schema.subContrib, eq(schema.subContrib.userId, schema.user.id))
    .orderBy(desc(schema.user.createdAt))
    .groupBy(schema.user.id)
    .offset(params.pageIndex * params.pageSize)
    .limit(params.pageSize);
}

export function userStats(id: string) {
  return db
    .select({
      contacts: countDistinct(schema.connection.userId),
      txs: countDistinct(schema.contribution.id),
      subs: countDistinct(schema.subContrib.id),
      groups: countDistinct(schema.membership.id),
    })
    .from(schema.user)
    .leftJoin(schema.connection, eq(schema.connection.ownerId, schema.user.id))
    .leftJoin(
      schema.contribution,
      eq(schema.contribution.userId, schema.user.id),
    )
    .leftJoin(schema.subContrib, eq(schema.subContrib.userId, schema.user.id))
    .leftJoin(schema.membership, eq(schema.membership.userId, schema.user.id))
    .where(eq(schema.user.id, id))
    .groupBy(schema.user.id);
}

export const languageCodesSince = (params: DateRangeParams) => {
  return db
    .select({
      key: schema.user.languageCode,
      count: countDistinct(schema.user.id),
    })
    .from(schema.user)
    .where(
      and(
        gt(schema.user.createdAt, params.startDate),
        lt(schema.user.createdAt, params.endDate),
      ),
    )
    .groupBy(schema.user.languageCode);
};

export function usersSince(params: DateRangeParams) {
  return db
    .select({ count: count() })
    .from(schema.user)
    .where(
      and(
        gt(schema.user.createdAt, params.startDate),
        lt(schema.user.createdAt, params.endDate),
      ),
    );
}

export function txsSince(params: DateRangeParams) {
  return db
    .select({ count: count() })
    .from(schema.transaction)
    .where(
      and(
        gt(schema.transaction.createdAt, params.startDate),
        lt(schema.transaction.createdAt, params.endDate),
      ),
    );
}

export function subsSince(params: DateRangeParams) {
  return db
    .select({ count: count() })
    .from(schema.subscription)
    .where(
      and(
        gt(schema.subscription.createdAt, params.startDate),
        lt(schema.subscription.createdAt, params.endDate),
      ),
    );
}

export function connectionsSince(params: DateRangeParams) {
  return db
    .select({ count: count() })
    .from(schema.connection)
    .where(
      and(
        gt(schema.connection.createdAt, params.startDate),
        lt(schema.connection.createdAt, params.endDate),
      ),
    );
}

export function groupsSince(params: DateRangeParams) {
  return db
    .select({ count: count() })
    .from(schema.group)
    .where(
      and(
        gt(schema.group.createdAt, params.startDate),
        lt(schema.group.createdAt, params.endDate),
      ),
    );
}

export function eventsPerDay(params: {
  event: EventName | null;
  range: DateRangeParams;
}) {
  return db
    .select({
      key: sql<Date>`DATE(${schema.event.createdAt})`,
      count: count(),
    })
    .from(schema.event)
    .where(
      and(
        gt(schema.event.createdAt, params.range.startDate),
        lt(schema.event.createdAt, params.range.endDate),
        eq(schema.event.name, params.event as EventName).if(params.event),
      ),
    )
    .groupBy(sql`DATE(${schema.event.createdAt})`);
}

export function eventsPerUser(params: {
  event: EventName | null;
  range: DateRangeParams;
}) {
  return db
    .select({
      key: schema.event.createdById,
      count: count(),
    })
    .from(schema.event)
    .where(
      and(
        eq(schema.event.name, params.event as EventName).if(params.event),
        gt(schema.event.createdAt, params.range.startDate),
        lt(schema.event.createdAt, params.range.endDate),
      ),
    )
    .groupBy(schema.event.createdById);
}

export function eventsPerUserWithUserCreation(params: {
  events: EventName[];
  eventRange: DateRangeParams;
  userRange: DateRangeParams;
}) {
  return db
    .select({
      key: schema.event.createdById,
      count: count(),
    })
    .from(schema.event)
    .leftJoin(schema.user, eq(schema.user.id, schema.event.createdById))
    .where(
      and(
        inArray(schema.event.name, params.events),
        gt(schema.event.createdAt, params.eventRange.startDate),
        lt(schema.event.createdAt, params.eventRange.endDate),
        gt(schema.user.createdAt, params.userRange.startDate),
        lt(schema.user.createdAt, params.userRange.endDate),
      ),
    )
    .groupBy(schema.event.createdById)
    .orderBy(desc(count()));
}
