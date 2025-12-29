import { type NextRequest } from "next/server";
import { env } from "~/env.mjs";
import { db } from "~/server/db";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ success: false }), { status: 401 });
  }

  await db.query.user.findFirst();

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
