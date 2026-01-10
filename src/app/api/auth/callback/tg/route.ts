import type { NextRequest } from "next/server";
import { z } from "zod";
import { env } from "~/env.mjs";
import { createAuthJWT } from "~/server/auth";
import { db, mutate } from "~/server/db";
import logger from "~/server/logger";
import { monitor } from "~/server/monitor/monitor";
import { addCookie } from "~/utils/cookies";
import { monitoredEdgeHandler } from "~/utils/handler_wrapper";
import { newEdgeRequest } from "~/utils/request";

const log = logger.child({ module: "api/auth/callback/tg" });

const GET = monitoredEdgeHandler(handler);
export { GET };

async function handler(req: NextRequest) {
  const header = new Headers({
    Location: `${env.NEXT_PUBLIC_BASE_URL}/webapp`,
    "Cache-Control": "no-store",
  });

  const query = req.nextUrl.search;
  log.info({ query }, "Received query");

  const data = await verifyTelegramData(query).catch((error) => {
    monitor.captureWithReq(error, newEdgeRequest(req), {
      properties: { query },
    });
    return null;
  });
  if (!data) {
    // TODO: Redirect to error page
    return new Response(null, { status: 307, headers: header });
  }

  const user = await mutate.user.getOrCreate(
    { db },
    {
      telegramId: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      username: data.username,
    },
  );

  const cookieValue = await createAuthJWT(user);
  addCookie(header, "auth", cookieValue);

  return new Response(null, { status: 307, headers: header });
}

const QuerySchema = z.object({
  id: z.string().transform((v) => parseInt(v)),
  first_name: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  last_name: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  username: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  photo_url: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
});

async function verifyTelegramData(query: string) {
  const { hash, checkString, values } = parseQuery(query);

  const hmac = await createSignature(checkString);
  if (hmac !== hash) {
    throw new Error("Invalid authorization data");
  }

  return QuerySchema.parse(values);
}

/** Telegram Verification

data_check_string = ...
secret_key = SHA256(<bot_token>)
if (hex(HMAC_SHA256(data_check_string, secret_key)) == hash) {
  // data is from Telegram
}

*/
async function createSignature(data: string) {
  const secretKey = await hash(env.BOT_TOKEN);

  const enc = new TextEncoder();
  const signature = await sign(secretKey, enc.encode(data));
  const hashArray = Array.from(new Uint8Array(signature));
  const digest = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return digest;
}

async function hash(data: string) {
  const enc = new TextEncoder();
  const buffer = enc.encode(data);
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return hash;
}

async function sign(secret: BufferSource, data: BufferSource) {
  const algo = { name: "HMAC", hash: "SHA-256" };
  const key = await crypto.subtle.importKey("raw", secret, algo, false, [
    "sign",
    "verify",
  ]);
  return await crypto.subtle.sign(algo.name, key, data);
}

function parseQuery(query: string) {
  const values = Object.fromEntries(new URLSearchParams(query));

  const hash = values.hash as string;

  const checkString = Object.entries(values)
    .filter(([key]) => key !== "hash")
    .sort()
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  return { hash, checkString, values };
}
