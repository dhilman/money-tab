import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";

export interface IncomingRequest {
  cookie: string;
  getUrl: () => URL;
  getHeader: (key: string) => string | null;
}

export function newEdgeRequest(req: NextRequest): IncomingRequest {
  return {
    cookie: req.headers.get("cookie") || "",
    getUrl: () => new URL(req.url),
    getHeader: (key: string) => req.headers.get(key),
  };
}

export function newNodeRequest(req: NextApiRequest): IncomingRequest {
  return {
    cookie: req.headers.cookie || "",
    getUrl: () => new URL(req.url ?? "", `https://${req.headers.host ?? ""}`),
    getHeader: (key: string) => req.headers[key.toLowerCase()] as string,
  };
}

// interface
