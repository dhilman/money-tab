import { SignJWT, jwtVerify } from "jose";
import { env } from "~/env.mjs";
import { getTgRequestHeaders } from "~/lib/tg-web-app-data";
import { validateAndParseInitData } from "~/server/bot/init_data";
import { db, mutate } from "~/server/db";
import type { SelectUser } from "~/server/db/types";
import logger from "~/server/logger";
import { verify_user_id } from "~/server/signing";
import { createCookie, parseMtCookieString } from "~/utils/cookies";
import type { IncomingRequest } from "~/utils/request";

interface Ctx {
  db: typeof db;
  req: IncomingRequest;
  res: {
    appendHeader: (key: string, value: string) => void;
  };
  user: SelectUser | null;
}

export const authenticate = async (ctx: Ctx) => {
  if (env.NODE_ENV === "test") return ctx.user as SelectUser;
  const cookies = parseMtCookieString(ctx.req.cookie);
  if (cookies.auth) {
    const payload = await verifyAuthJWT(cookies.auth);
    const user = await db.query.user.findFirst({
      where: (v, { eq }) => eq(v.id, payload.sub),
    });
    if (!user) throw new Error("User not found");
    return user;
  }
  if (cookies.assumedUserId) {
    const id = await verify_user_id(cookies.assumedUserId);
    const user = await db.query.user.findFirst({
      where: (v, { eq }) => eq(v.id, id),
    });
    if (!user) throw new Error("User not found");
    return user;
  }

  const { apiKey, startParam } = getTgRequestHeaders(ctx.req);
  const data = await verifyApiKey(ctx, apiKey);

  const user = await mutate.user.getOrCreate(ctx, {
    telegramId: data.user.id,
    firstName: data.user.first_name,
    lastName: data.user.last_name,
    username: data.user.username,
    isRegistered: data.user.allows_write_to_pm,
    languageCode: data.user.language_code,
    referrer: startParam || undefined,
  });

  if (!cookies.userId) {
    const cookieValue = createCookie("userId", user.id);
    ctx.res.appendHeader("Set-Cookie", cookieValue);
  }

  return user;
};

async function verifyApiKey(ctx: Ctx, apiKey: string | null) {
  if (!apiKey) {
    if (env.NEXT_PUBLIC_ENV === "prod") {
      throw new Error("Missing API key");
    }
    if (env.MOCK_AUTH && env.MOCK_TG_USER_ID) {
      logger.warn("Missing initData, using mock data");
      return {
        user: { id: env.MOCK_TG_USER_ID },
        auth_date: BigInt(1619450000),
      };
    }
    const referer = ctx.req.getHeader("referer");
    if (referer?.includes("/webapp/test")) {
      return { user: { id: 1 }, auth_date: BigInt(1619450000) };
    }
    throw new Error("Missing API key");
  }
  return await validateAndParseInitData(apiKey);
}

const authSecret = new TextEncoder().encode(env.AUTH_SECRET);
const alg = "HS256";

interface AuthJWT {
  sub: string;
}

export const createAuthJWT = async (user: { id: string }): Promise<string> => {
  return await new SignJWT({ sub: user.id })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(authSecret);
};

const verifyAuthJWT = async (token: string): Promise<AuthJWT> => {
  const { payload } = await jwtVerify(token, authSecret, { algorithms: [alg] });
  if (!payload.sub) throw new Error("Invalid JWT");
  return payload as AuthJWT;
};
