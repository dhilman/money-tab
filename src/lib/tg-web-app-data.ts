import { HEADER_TG_API_KEY, HEADER_TG_REFERRER } from "~/lib/consts/headers";
import { type IncomingRequest } from "~/utils/request";

const SESSION_KEY = "tgWebAppData";

function getTgWebAppData() {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.slice(1));
  const data = params.get("tgWebAppData") ?? "";
  if (!data) {
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    return sessionData ?? "";
  }
  sessionStorage.setItem(SESSION_KEY, data);
  return data;
}

function getTgStartParam() {
  if (typeof window === "undefined") return "";
  const search = window.location.search;
  const params = new URLSearchParams(search);
  return params.get("tgWebAppStartParam") ?? "";
}

export function createTgRequestHeaders() {
  return {
    [HEADER_TG_API_KEY]: getTgWebAppData(),
    [HEADER_TG_REFERRER]: getTgStartParam(),
  };
}

export function getTgRequestHeaders(req: IncomingRequest) {
  const apiKey = req.getHeader(HEADER_TG_API_KEY);
  const startParam = req.getHeader(HEADER_TG_REFERRER);
  return { apiKey, startParam };
}
