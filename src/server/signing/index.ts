import { tg_hmac } from "~/server/signing/edge";
import { env } from "~/env.mjs";

const MAX_VALID_TIME = 60 * 60 * 24; // 1 day
const SHORT_SIG_LENGTH = 16;

export async function sign_user_id(userId: string) {
  // current timestamp in seconds
  const timestamp = Math.floor(Date.now() / 1000);

  const data = `${userId}-${timestamp}`;

  const signature = await tg_hmac({
    key: env.BOT_TOKEN,
    salt: "UserId",
    data,
  });
  const short_signature = signature.slice(0, SHORT_SIG_LENGTH);

  return `${data}-${short_signature}`;
}

export async function verify_user_id(data: string) {
  const [userId, timestamp, signature] = data.split("-");
  if (!userId || !timestamp || !signature) {
    throw new Error("Invalid data format");
  }

  const timestampNum = Number(timestamp);
  if (isNaN(timestampNum)) {
    throw new Error("Invalid timestamp");
  }
  if (timestampNum < 0) {
    throw new Error("Invalid timestamp");
  }
  if (timestampNum + MAX_VALID_TIME < Math.floor(Date.now() / 1000)) {
    throw new Error("Expired timestamp");
  }

  const expectedSignature = await tg_hmac({
    key: env.BOT_TOKEN,
    salt: "UserId",
    data: `${userId}-${timestamp}`,
  });
  const short = expectedSignature.slice(0, SHORT_SIG_LENGTH);

  if (signature !== short) {
    throw new Error("Invalid signature");
  }

  return userId;
}

export { tg_hmac };
