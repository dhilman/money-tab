import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { txRouter } from "~/server/api/routers/tx";
import { userRouter } from "~/server/api/routers/user";
import { adminRouter } from "~/server/api/routers/admin";
import { subRouter } from "~/server/api/routers/sub";
import { groupRouter } from "~/server/api/routers/group";
import { healthHandler } from "~/server/api/handlers/health";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  tx: txRouter,
  sub: subRouter,
  group: groupRouter,
  admin: adminRouter,
  health: healthHandler,
});

export const createCaller = createCallerFactory(appRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
