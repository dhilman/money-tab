import { count, inArray, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { EVENT_NAMES } from "~/lib/consts/constants";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { bot } from "~/server/bot/bot";
import { db, db_utils, mutate, queries, schema } from "~/server/db";
import { mdb, mqueries, mschema } from "~/server/monitor/mdb";
import { sign_user_id } from "~/server/signing";
import { validator } from "~/server/validator";
import { createCookie } from "~/utils/cookies";

function isoDateToSqlDateTime(date: string) {
  return db_utils.dateToSqlDateTime(new Date(date));
}

function sqlDateRange(params: { startDate: string; endDate: string }) {
  return {
    startDate: isoDateToSqlDateTime(params.startDate),
    endDate: isoDateToSqlDateTime(params.endDate),
  };
}

export const adminRouter = createTRPCRouter({
  getUserLink: adminProcedure
    .input(
      z.object({
        telegramId: z.number().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!input.telegramId) return;
      if (!ctx.user.telegramId) {
        throw new Error("No telegram id");
      }
      await bot.api.sendMessage(
        ctx.user.telegramId,
        `[Link](tg://user?id=${input.telegramId})`,
        { parse_mode: "MarkdownV2" }
      );
      return true;
    }),
  createUser: adminProcedure
    .input(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        username: z.string().optional(),
        isRegistered: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await mutate.user.create(ctx, {
        telegramId: Math.floor(Math.random() * 1000000),
        firstName: input.firstName,
        lastName: input.lastName,
        username: input.username,
        isRegistered: input.isRegistered,
      });
      return user;
    }),
  users: adminProcedure
    .input(
      z.object({
        pageIndex: z.number().default(0),
        pageSize: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const [users, total] = await db.batch([
        queries.admin.users(input),
        db.select({ count: count() }).from(schema.user),
      ]);
      return { users, total: total[0]?.count ?? 0 };
    }),
  user: adminProcedure.input(z.string()).query(async ({ input }) => {
    const user = await db.query.user.findFirst({
      where: (v, { eq }) => eq(v.id, input),
    });
    if (!user) throw new Error("User not found");
    const [stats, sessions] = await Promise.all([
      queries.admin.userStats(user.id),
      mqueries.userSessions({ userId: user.id }),
    ]);

    return {
      stats: stats[0],
      user,
      sessions,
    };
  }),
  assumeUser: adminProcedure
    .input(
      z.object({
        id: z.string(),
        minutes: z.number().default(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx?.user?.role !== "SUPER") {
        throw new Error("Unauthorized");
      }
      const user = await db.query.user.findFirst({
        where: (v, { eq }) => eq(v.id, input.id),
      });
      if (!user) {
        throw new Error("User not found");
      }
      const signed = await sign_user_id(user.id);
      const cookieValue = createCookie("assumedUserId", signed, {
        maxAge: input.minutes * 60,
      });
      ctx.res.appendHeader("Set-Cookie", cookieValue);
      return user;
    }),
  totals: adminProcedure.query(async () => {
    const [users, txs, subs, connections, groups] = await db.batch([
      db.select({ count: count() }).from(schema.user),
      db.select({ count: count() }).from(schema.transaction),
      db.select({ count: count() }).from(schema.subscription),
      db.select({ count: count() }).from(schema.connection),
      db.select({ count: count() }).from(schema.group),
    ]);

    return {
      users: users[0]?.count,
      txs: txs[0]?.count,
      subs: subs[0]?.count,
      connections: connections[0]?.count,
      groups: groups[0]?.count,
    };
  }),
  stats: adminProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const range = sqlDateRange(input);

      const [newUsers, txs, subs, connections, groups] = await db.batch([
        queries.admin.usersSince(range),
        queries.admin.txsSince(range),
        queries.admin.subsSince(range),
        queries.admin.connectionsSince(range),
        queries.admin.groupsSince(range),
      ]);

      const [sessions, events, issues] = await mdb.batch([
        mqueries.sessionsSince(range),
        mqueries.eventsSince(range),
        mqueries.openIssuesSince(range),
      ]);

      return {
        newUsers: newUsers[0]?.count,
        sessions: sessions[0]?.count,
        users: sessions[0]?.unique,
        txs: txs[0]?.count,
        subs: subs[0]?.count,
        groups: groups[0]?.count,
        connections: connections[0]?.count,
        events: events,
        issues: issues[0],
      };
    }),
  userStats: adminProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const range = sqlDateRange(input);

      const [uPerDay, countries, oss] = await mdb.batch([
        mqueries.uniqueVisitorsPerDay(range),
        mqueries.countryCountsSince(range),
        mqueries.osCountsSince(range),
      ]);
      const langCodes = await queries.admin.languageCodesSince(range);

      return {
        users: uPerDay,
        countries: countries.sort((a, b) => b.count - a.count),
        os: oss.sort((a, b) => b.count - a.count),
        langCodes: langCodes.sort((a, b) => b.count - a.count),
      };
    }),
  uniqueIssues: adminProcedure.query(async () => {
    return await mqueries.openUniqueIssues();
  }),
  sessions: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        events: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      return await mdb.query.session.findMany({
        with: {
          events: {
            orderBy: (v, { desc }) => [desc(v.timestamp)],
            limit: input.events,
          },
        },
        where: (v, { eq }) => eq(v.isAnonymous, false),
        orderBy: (v, { desc }) => desc(v.startAt),
        limit: input.limit,
      });
    }),
  pageViews: adminProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const range = sqlDateRange(input);

      const [perDay, loadTimes] = await mdb.batch([
        mqueries.pageViewsPerDay(range),
        mdb.query.event.findMany({
          columns: { loadTime: true, interactiveTime: true },
          where: (v, { and, eq, isNotNull, gt }) =>
            and(
              isNotNull(v.loadTime),
              gt(v.timestamp, range.startDate),
              lt(v.timestamp, range.endDate),
              eq(v.isAnonymous, false)
            ),
          orderBy: (v, { desc }) => desc(v.timestamp),
          limit: 1000,
        }),
      ]);

      return { perDay, loadTimes };
    }),
  issues: adminProcedure
    .input(
      z.object({
        hash: z.string(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const [issue, instances] = await mdb.batch([
        mdb.query.issue.findFirst({
          where: (v, { eq }) => eq(v.hash, input.hash),
          extras: {
            count: count().as("count"),
          },
        }),
        mdb.query.issue.findMany({
          where: (v, { eq }) => eq(v.hash, input.hash),
          limit: input.limit,
          orderBy: (v, { desc }) => desc(v.timestamp),
        }),
      ]);
      validator.exists(issue, "Issue not found");

      return { issue, instances };
    }),
  resolve: adminProcedure
    .input(z.object({ hashes: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      await mdb
        .update(mschema.issue)
        .set({
          resolvedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(inArray(mschema.issue.hash, input.hashes));
      return true;
    }),
  events: adminProcedure
    .input(
      z.object({
        event: z.enum(EVENT_NAMES),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const range = sqlDateRange(input);

      const [perDay, perUser] = await db.batch([
        queries.admin.eventsPerDay({
          event: input.event,
          range,
        }),
        queries.admin.eventsPerUser({
          event: input.event,
          range,
        }),
      ]);

      return { perDay, perUser };
    }),
  eventsWithUserCreation: adminProcedure
    .input(
      z.object({
        events: z.array(z.enum(EVENT_NAMES)),
        eventRange: z.object({
          startDate: z.string(),
          endDate: z.string(),
        }),
        userRange: z.object({
          startDate: z.string(),
          endDate: z.string(),
        }),
      })
    )
    .query(async ({ input }) => {
      const [perUser] = await db.batch([
        queries.admin.eventsPerUserWithUserCreation({
          events: input.events,
          eventRange: sqlDateRange(input.eventRange),
          userRange: sqlDateRange(input.userRange),
        }),
      ]);

      return { perUser };
    }),
  notifications: adminProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const range = sqlDateRange(input);

      const counts = await mqueries.notifsPerDay(range);

      return { counts };
    }),
});
