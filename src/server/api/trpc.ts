import { initTRPC } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import superjson from "superjson";
import { ZodError } from "zod";
import { authenticate } from "~/server/auth";
import { db, type Db } from "~/server/db";
import { type SelectUser } from "~/server/db/types";
import logger from "~/server/logger";
import { monitor } from "~/server/monitor/monitor";
import { newNodeRequest, type IncomingRequest } from "~/utils/request";

type Context = {
  db: Db;
  res: CreateNextContextOptions["res"];
  req: IncomingRequest;
  userId: string | null;
  user: SelectUser | null;
};

export type MyContext = Context & {
  userId: string;
  user: SelectUser;
};

export const createTRPCContext = (_opts: CreateNextContextOptions): Context => {
  return {
    db,
    res: _opts.res,
    req: newNodeRequest(_opts.req),
    userId: null,
    user: null,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

const monitoring = t.middleware(async (opts) => {
  const res = await opts.next();
  // In tRPC v11, rawInput was replaced with getRawInput() async function
  const rawInput = await opts.getRawInput();

  function capture() {
    if (res.ok) return;
    if (res.error.code === "NOT_FOUND") {
      logger.warn(
        { error: res.error, input: rawInput },
        "Not found, skipping monitoring",
      );
      return;
    }

    let err = res.error;
    if (res.error.cause) {
      err = res.error;
    }
    monitor.captureWithReq(err, opts.ctx.req, {
      statusCode: getHTTPStatusCodeFromError(res.error),
      procedure: opts.path,
      userId: opts.ctx?.userId ?? undefined,
      properties: {
        inputs: rawInput,
      },
    });
  }

  if (!res.ok) capture();

  await monitor.flush();
  return res;
});

const mustBeAuthenticated = t.middleware(async ({ ctx, next }) => {
  const user = await authenticate(ctx);

  // Updating existing ctx so up the chain we have access to the user
  ctx.userId = user.id;
  ctx.user = user;

  // Doing destructing here so type inference can pick up
  // that user is not null
  return await next({ ctx: { ...ctx, userId: user.id, user } });
});

export const privateProcedure = t.procedure
  .use(monitoring)
  .use(mustBeAuthenticated);

const mustBeAdmin = t.middleware(async ({ ctx, next }) => {
  const { user, userId } = ctx;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER")) {
    throw new Error("Unauthorized");
  }

  return next({ ctx: { ...ctx, user, userId } });
});

export const adminProcedure = privateProcedure.use(mustBeAdmin);
