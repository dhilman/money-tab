import {
  and,
  count,
  countDistinct,
  eq,
  gt,
  isNull,
  lt,
  max,
  min,
  sql,
} from "drizzle-orm";
import { mdb, mschema } from "~/server/monitor/mdb";

interface CountParams {
  startDate: string;
  endDate: string;
}

export const sessionsSince = (params: CountParams) => {
  return mdb
    .select({
      unique: countDistinct(mschema.session.userId),
      count: count(),
    })
    .from(mschema.session)
    .where(
      and(
        gt(mschema.session.startAt, params.startDate),
        lt(mschema.session.startAt, params.endDate),
        eq(mschema.session.isAnonymous, false)
      )
    );
};

export const countryCountsSince = (params: CountParams) => {
  return mdb
    .select({
      key: mschema.session.country,
      count: countDistinct(mschema.session.userId),
    })
    .from(mschema.session)
    .where(
      and(
        gt(mschema.session.startAt, params.startDate),
        lt(mschema.session.startAt, params.endDate),
        eq(mschema.session.isAnonymous, false)
      )
    )
    .groupBy(mschema.session.country);
};

export const osCountsSince = (params: CountParams) => {
  return mdb
    .select({
      key: mschema.session.os,
      count: countDistinct(mschema.session.userId),
    })
    .from(mschema.session)
    .where(
      and(
        gt(mschema.session.startAt, params.startDate),
        lt(mschema.session.startAt, params.endDate),
        eq(mschema.session.isAnonymous, false)
      )
    )
    .groupBy(mschema.session.os);
};

export const uniqueVisitorsPerDay = (params: CountParams) => {
  return mdb
    .select({
      key: sql<Date>`DATE(${mschema.session.startAt})`,
      count: countDistinct(mschema.session.userId),
    })
    .from(mschema.session)
    .where(
      and(
        eq(mschema.session.isAnonymous, false),
        gt(mschema.session.startAt, params.startDate),
        lt(mschema.session.startAt, params.endDate)
      )
    )
    .groupBy(sql`DATE(${mschema.session.startAt})`)
    .orderBy(sql`DATE(${mschema.session.startAt})`);
};

export const pageViewsPerDay = (params: CountParams) => {
  return mdb
    .select({
      key: sql<Date>`DATE(${mschema.event.timestamp})`,
      count: sql<number>`cast(COUNT(*) as UNSIGNED)`,
    })
    .from(mschema.event)
    .where(
      and(
        gt(mschema.event.timestamp, params.startDate),
        lt(mschema.event.timestamp, params.endDate),
        eq(mschema.event.type, "page"),
        eq(mschema.event.isAnonymous, false)
      )
    )
    .groupBy(sql`DATE(${mschema.event.timestamp})`)
    .orderBy(sql`DATE(${mschema.event.timestamp})`);
};

export const notifsPerDay = (params: CountParams) => {
  return mdb
    .select({
      key: sql<Date>`DATE(${mschema.event.timestamp})`,
      name: mschema.event.name,
      count: sql<number>`cast(COUNT(*) as UNSIGNED)`,
    })
    .from(mschema.event)
    .where(
      and(
        gt(mschema.event.timestamp, params.startDate),
        lt(mschema.event.timestamp, params.endDate),
        eq(mschema.event.type, "notify")
      )
    )
    .groupBy(sql`DATE(${mschema.event.timestamp})`, mschema.event.name);
};

export const eventsSince = (params: CountParams) => {
  return mdb
    .select({
      type: mschema.event.type,
      count: count(),
    })
    .from(mschema.event)
    .where(
      and(
        gt(mschema.event.timestamp, params.startDate),
        lt(mschema.event.timestamp, params.endDate),
        eq(mschema.event.isAnonymous, false)
      )
    )
    .groupBy(mschema.event.type);
};

export const recentSessions = (params: { limit: number }) => {
  return mdb.query.session.findMany({
    columns: {
      id: true,
      userId: true,
      startAt: true,
      lastActiveAt: true,
      endAt: true,
      country: true,
      os: true,
      browser: true,
      deviceModel: true,
    },
    where: (s, { eq, and }) =>
      and(
        eq(
          s.startAt,
          mdb
            .select({
              startAt: sql`MAX(${mschema.session.startAt})`,
            })
            .from(mschema.session)
            .where(eq(mschema.session.userId, s.userId))
        ),
        eq(s.isAnonymous, false)
      ),
    with: {
      events: {
        orderBy: (p, { desc }) => [desc(p.timestamp)],
        limit: 10,
      },
    },
    limit: params.limit,
    orderBy: (p, { desc }) => [desc(p.startAt)],
  });
};

export const openIssuesSince = (params: CountParams) => {
  return mdb
    .select({
      count: count(),
      unique: countDistinct(mschema.issue.hash),
    })
    .from(mschema.issue)
    .where(
      and(
        isNull(mschema.issue.resolvedAt),
        gt(mschema.issue.timestamp, params.startDate),
        lt(mschema.issue.timestamp, params.endDate)
      )
    );
};

export const openUniqueIssues = () => {
  return mdb
    .select({
      hash: mschema.issue.hash,
      timestamp: max(mschema.issue.timestamp),
      count: count(),
      type: min(mschema.issue.type),
      path: min(mschema.issue.path),
      procedure: min(mschema.issue.procedure),
      message: min(mschema.issue.message),
    })
    .from(mschema.issue)
    .where(isNull(mschema.issue.resolvedAt))
    .groupBy(mschema.issue.hash)
    .orderBy(sql`MAX(${mschema.issue.timestamp}) DESC`);
};

export const userSessions = (params: { userId: string }) => {
  return mdb.query.session.findMany({
    where: (v, { eq }) => eq(v.userId, params.userId),
    orderBy: (v, { desc }) => desc(v.startAt),
    with: {
      events: {
        orderBy: (v, { desc }) => desc(v.timestamp),
        limit: 10,
      },
    },
    limit: 5,
  });
};
