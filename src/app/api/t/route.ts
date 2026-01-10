import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";
import { userAgent, type NextRequest } from "next/server";
import { z } from "zod";
import logger from "~/server/logger";
import { mdb, mschema, type mtypes } from "~/server/monitor/mdb";
import { addCookie, parseMtCookies } from "~/utils/cookies";
import { monitoredEdgeHandler } from "~/utils/handler_wrapper";

const log = logger.child({ module: "api/t" });

const AnalyticsEventSchema = z.object({
  sess: z.enum(["start", "end"]).optional(),
  // Event name
  n: z.enum(["sess", "page", "tour_started", "tour_completed"]),
  // URL
  url: z.string(),
  // Timestamp
  t: z.string(),
  // Referrer
  r: z.string().optional(),
  // Page load time
  plt: z.number().optional(),
  // Page interactive time
  pit: z.number().optional(),
  // Viewport width
  vw: z.number().optional(),
  // Viewport height
  vh: z.number().optional(),
  // Properties
  p: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

const BodySchema = z.array(AnalyticsEventSchema);

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// Send GIF response to prevent caching
const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

const POST = monitoredEdgeHandler(handler);
export { POST };

async function handler(req: NextRequest) {
  log.debug("received events");
  const agent = userAgent(req);
  if (agent.isBot) {
    return new Response(GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store",
      },
    });
  }

  const data = await parseRequestBody(req);

  const header: Headers = new Headers({
    "Content-Type": "image/gif",
    "Cache-Control": "no-store",
  });

  const cookies = parseMtCookies(req);

  let userId = cookies.userId;
  let isAnonymous = false;
  if (!userId) {
    isAnonymous = true;
    userId = cookies.distinctId || createId();
    addCookie(header, "distinctId", userId);
  }

  const sessionId = cookies.sessionId || createId();
  addCookie(header, "sessionId", sessionId);

  const eventInserts = [];
  if (data.events.length > 0) {
    eventInserts.push(
      insertEvents({
        userId,
        sessionId,
        isAnonymous,
        events: data.events,
      }),
    );
  }

  log.debug(
    {
      userId,
      sessionId,
      events: data.events.map((e) => ({ name: e.n, t: e.t })),
    },
    "inserting events",
  );

  await mdb.batch([
    insertOrUpdateSession({
      session: data.session,
      req,
      agent,
      userId,
      sessionId,
      isAnonymous,
    }),
    ...eventInserts,
  ]);

  return new Response(GIF, {
    status: 200,
    headers: header,
  });
}

interface SessionData {
  start: AnalyticsEvent | undefined;
  end: AnalyticsEvent | undefined;
  lastTime: string;
}

async function parseRequestBody(req: NextRequest) {
  const body = (await req.json()) as unknown;
  const rawEvents = BodySchema.parse(body);

  let sessionStart: AnalyticsEvent | undefined;
  let sessionEnd: AnalyticsEvent | undefined;
  let lastTime = "0";
  const events: AnalyticsEvent[] = [];

  for (const event of rawEvents) {
    if (lastTime < event.t) {
      lastTime = event.t;
    }
    if (event?.sess === "start") {
      sessionStart = event;
    } else if (event?.sess === "end") {
      sessionEnd = event;
    } else {
      events.push(event);
    }
  }

  return {
    events,
    session: { start: sessionStart, end: sessionEnd, lastTime },
  };
}

function sqlFormatTime(time: string) {
  return sql<string>`strftime('%Y-%m-%d %H:%M:%f', ${time})`;
}

function insertEvents(params: {
  userId: string;
  sessionId: string;
  isAnonymous: boolean;
  events: AnalyticsEvent[];
}) {
  return mdb
    .insert(mschema.event)
    .values(
      params.events.map((e) => {
        const url = new URL(e.url);
        return {
          timestamp: sqlFormatTime(e.t) as unknown as string,
          type: e.n,
          userId: params.userId,
          sessionId: params.sessionId,
          isAnonymous: params.isAnonymous,

          host: url.hostname,
          path: url.pathname,
          query: url.search,

          loadTime: e.plt,
          interactiveTime: e.pit,
        } as mtypes.InsertEvent;
      }),
    )
    .onConflictDoNothing();
}

function insertOrUpdateSession(params: {
  session: SessionData;
  req: NextRequest;
  agent: ReturnType<typeof userAgent>;
  userId: string;
  sessionId: string;
  isAnonymous: boolean;
}) {
  const { start: sessionStart, end: sessionEnd, lastTime } = params.session;
  const headers = params.req.headers;

  if (sessionStart) {
    const url = new URL(sessionStart.url);
    const ref = sessionStart.r ? new URL(sessionStart.r) : null;
    return mdb
      .insert(mschema.session)
      .values({
        id: params.sessionId,
        userId: params.userId,
        isAnonymous: params.isAnonymous,

        startAt: sqlFormatTime(sessionStart.t),
        lastActiveAt: sqlFormatTime(lastTime),
        endAt: sessionEnd ? sqlFormatTime(sessionEnd.t) : null,

        host: url.hostname,
        path: url.pathname,
        query: url.search,

        ipAddress: headers.get("x-real-ip"),
        continent: headers.get("x-vercel-ip-continent"),
        country: headers.get("x-vercel-ip-country"),
        region: headers.get("x-vercel-ip-region"),
        city: headers.get("x-vercel-ip-city"),
        latitude: headers.get("x-vercel-ip-latitude"),
        longitude: headers.get("x-vercel-ip-longitude"),

        userAgent: params.agent.ua,
        deviceType: params.agent.device?.type,
        deviceVendor: params.agent.device?.vendor,
        deviceModel: params.agent.device?.model,
        os: params.agent.os.name,
        browser: params.agent.browser.name,
        engine: params.agent.engine.name,

        referrerHost: ref?.hostname,
        referrer: sessionStart.r ? sessionStart.r : null,
      })
      .onConflictDoUpdate({
        target: mschema.session.id,
        set: {
          lastActiveAt: sqlFormatTime(lastTime),
          endAt: sessionEnd ? sqlFormatTime(sessionEnd.t) : null,
        },
      });
  }
  if (sessionEnd) {
    return mdb
      .update(mschema.session)
      .set({
        lastActiveAt: sqlFormatTime(sessionEnd.t),
        endAt: sqlFormatTime(sessionEnd.t),
      })
      .where(eq(mschema.session.id, params.sessionId));
  }

  return mdb
    .update(mschema.session)
    .set({
      lastActiveAt: sqlFormatTime(lastTime),
    })
    .where(eq(mschema.session.id, params.sessionId));
}
