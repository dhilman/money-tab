import { env } from "~/env.mjs";

const BOT_USERNAME = env.NEXT_PUBLIC_BOT_USERNAME;
const BOT_APP_NAME = env.NEXT_PUBLIC_BOT_APP_NAME;

export const URLS = {
  TG_SUPPORT: "https://t.me/devdvd",
  PRIVACY: env.NEXT_PUBLIC_BASE_URL + "/privacy",
  BOT_URL: `https://t.me/${BOT_USERNAME}`,
  BOT_URL_START: `https://t.me/${BOT_USERNAME}?start`,
  BOT_WEB_APP: `https://t.me/${BOT_USERNAME}/${BOT_APP_NAME}`,
  BOT_URL_GROUP: `https://t.me/${BOT_USERNAME}?startgroup`,
};
