import type { NextRequest } from "next/server";
import { tgNotify } from "~/server/bot/tg-send";
import { monitor } from "~/server/monitor/monitor";
import { NotifyMessageSchema } from "~/server/queue/messages";
import { queueReceiver } from "~/server/queue/receiver";
import { monitoredEdgeHandler } from "~/utils/handler_wrapper";
import { newEdgeRequest } from "~/utils/request";

const POST = monitoredEdgeHandler(handler);
export { POST };

async function handler(req: NextRequest) {
  let body: unknown;
  try {
    body = await queueReceiver.verify(req);
  } catch (e) {
    monitor.captureWithReq(e, newEdgeRequest(req));
    return new Response(JSON.stringify({ success: false }), { status: 400 });
  }

  const parsed = NotifyMessageSchema.safeParse(body);
  if (!parsed.success) {
    monitor.captureWithReq(parsed.error, newEdgeRequest(req));
    return new Response(JSON.stringify({ success: false }), { status: 400 });
  }

  const result = await tgNotify(parsed.data.sendTo, parsed.data.data);
  if (!result) {
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
