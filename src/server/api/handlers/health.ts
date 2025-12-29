import { TRPCError } from "@trpc/server";
import { env } from "~/env.mjs";
import { publicProcedure } from "~/server/api/trpc";

export const healthHandler = publicProcedure.query(async ({ ctx }) => {
  const auth = ctx.req.getHeader("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }
  await ctx.db.query.user.findFirst();
  return "ok";
});
