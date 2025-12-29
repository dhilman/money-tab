import { Client } from "@upstash/qstash";
import { env } from "~/env.mjs";
import type { AvatarMessage, NotifyMessage } from "~/server/queue/messages";

const URLS = {
  notification: `${env.NEXT_PUBLIC_BASE_URL}/api/webhook/notify`,
  avatar: `${env.NEXT_PUBLIC_BASE_URL}/api/tg/avatar`,
};

interface PublishOptions {
  // Delay in seconds
  delay?: number;
  // Number of retries
  retries?: number;
}

class QueueClient {
  client: Client;

  constructor() {
    this.client = new Client({ token: env.QSTASH_TOKEN });
  }

  private async send(url: string, body: unknown, opts?: PublishOptions) {
    if (env.NODE_ENV === "development") {
      await fetch(url, { method: "POST", body: JSON.stringify(body) });
      return;
    }
    await this.client.publishJSON({
      body,
      url,
      delay: opts?.delay,
      retries: opts?.retries,
    });
  }

  private async sendBatch(url: string, bodies: unknown[]) {
    if (env.NODE_ENV === "development") return;
    await this.client.batchJSON(bodies.map((d) => ({ body: d, url: url })));
  }

  async notification(data: NotifyMessage, opts?: PublishOptions) {
    await this.send(URLS.notification, data, opts);
  }

  async notificationBatch(data: NotifyMessage[]) {
    await this.sendBatch(URLS.notification, data);
  }

  async avatar(data: AvatarMessage, opts?: PublishOptions) {
    await this.send(URLS.avatar, data, opts);
  }
}

export const queueClient = new QueueClient();
