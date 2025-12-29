import { parse, serialize } from "cookie";
import { env } from "~/env.mjs";

const COOKIES = {
  userId: "_mt_userId",
  distinctId: "_mt_distinctId",
  sessionId: "_mt_sessionId",
  assumedUserId: "_mt_assumedUserId",
  auth: "_mt_auth",
};

type CookieType = keyof typeof COOKIES;

interface MTCookies {
  userId?: string;
  distinctId?: string;
  sessionId?: string;
  assumedUserId?: string;
  auth?: string;
}

export function parseMtCookies(req: Request): MTCookies {
  const cookiesStr = req.headers.get("cookie");
  return parseMtCookieString(cookiesStr || "");
}

export function parseMtCookieString(cookieStr: string): MTCookies {
  if (env.NODE_ENV === "test") return {};
  const cookies = parse(cookieStr);
  return {
    userId: cookies[COOKIES.userId],
    distinctId: cookies[COOKIES.distinctId],
    sessionId: cookies[COOKIES.sessionId],
    assumedUserId: cookies[COOKIES.assumedUserId],
    auth: cookies[COOKIES.auth],
  };
}

const COOKIE_MAX_AGE = {
  userId: 60 * 60 * 24 * 365, // 1 year
  distinctId: 60 * 60 * 24 * 365, // 1 year
  sessionId: 60 * 5, // 5 minutes
  auth: 60 * 60 * 24 * 30, // 30 days
  assumedUserId: 60 * 5, // 5 minutes
};

interface CookieOptions {
  // Age in seconds
  maxAge: number;
}

export function addCookie(
  headers: Headers,
  type: CookieType,
  value: string,
  opts?: CookieOptions
) {
  headers.append("Set-Cookie", createCookie(type, value, opts));
}

export function createCookie(
  type: CookieType,
  value: string,
  opts?: CookieOptions
): string {
  function create(name: string, maxAge: number) {
    return serialize(name, value, {
      path: "/",
      maxAge,
      sameSite: "lax",
      httpOnly: true,
      secure: true,
      ...opts,
    });
  }

  switch (type) {
    case "userId":
      return create(COOKIES.userId, COOKIE_MAX_AGE.userId);
    case "distinctId":
      return create(COOKIES.distinctId, COOKIE_MAX_AGE.distinctId);
    case "sessionId":
      return create(COOKIES.sessionId, COOKIE_MAX_AGE.sessionId);
    case "auth":
      return create(COOKIES.auth, COOKIE_MAX_AGE.auth);
    case "assumedUserId":
      return create(COOKIES.assumedUserId, COOKIE_MAX_AGE.assumedUserId);
  }
}
