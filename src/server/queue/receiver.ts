import { Receiver } from "@upstash/qstash";
import type { NextRequest } from "next/server";
import { env } from "~/env.mjs";

class QueueReceiver {
  private receiver: Receiver;

  constructor() {
    this.receiver = new Receiver({
      currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
    });
  }

  async verify(req: NextRequest) {
    if (env.NODE_ENV === "development") {
      return JSON.parse(await req.text()) as unknown;
    }

    const key = req.headers.get("upstash-signature");
    if (!key) {
      throw new Error("no signature");
    }

    const body = await req.text();
    const valid = await this.receiver.verify({ signature: key, body });
    if (!valid) {
      throw new Error("invalid signature");
    }

    return JSON.parse(body) as unknown;
  }
}

export const queueReceiver = new QueueReceiver();
