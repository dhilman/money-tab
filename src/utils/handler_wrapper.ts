import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";
import { monitor } from "~/server/monitor/monitor";
import { newEdgeRequest, newNodeRequest } from "~/utils/request";

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse,
) => Promise<NextApiResponse>;

export function monitoredHandler(handler: Handler) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    const r = await handler(req, res).catch((error) => {
      monitor.captureWithReq(error, newNodeRequest(req));
    });
    await monitor.flush();
    if (!r) {
      res.status(500).end();
      return;
    }
  };
}

type EdgeHandler = (req: NextRequest) => Promise<Response>;

export function monitoredEdgeHandler(handler: EdgeHandler) {
  return async function (req: NextRequest) {
    const res = await handler(req).catch((error) => {
      monitor.captureWithReq(error, newEdgeRequest(req));
    });
    await monitor.flush();
    if (!res) {
      return new Response("Internal server error", { status: 500 });
    }
    return res;
  };
}
