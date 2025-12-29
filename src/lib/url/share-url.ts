import { URLS } from "~/lib/consts/urls";
import {
  decodeUrlPath,
  encodeUrlPath,
  type ParsedUrlPath,
} from "~/lib/url/param-codec";

export function getTgUrl(path: ParsedUrlPath): string {
  const param = encodeUrlPath(path);
  return `${URLS.BOT_WEB_APP}?startapp=${param}`;
}

export function getTgWebAppUrl(path: ParsedUrlPath): string {
  const param = encodeUrlPath(path);
  return `${URLS.BOT_WEB_APP}?startapp=${param}`;
}

export function getTgShareUrl(url: string, text?: string): string {
  const out = `https://t.me/share/url?url=${encodeURIComponent(url)}`;
  if (text) return out + `&text=${encodeURIComponent(text)}`;
  return out;
}

export function getTgWebAppShareUrl(
  path: ParsedUrlPath,
  text?: string
): string {
  const url = getTgWebAppUrl(path);
  return getTgShareUrl(url, text);
}

export function parseTgSearchParams(params: URLSearchParams) {
  const start = params.get("tgWebAppStartParam");
  if (!start) return null;
  return decodeUrlPath(start);
}
