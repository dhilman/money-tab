import { env } from "~/env.mjs";
import { db_utils } from "~/server/db";
import logger from "~/server/logger";
import { mdb, mschema } from "~/server/monitor/mdb";
import { parseMtCookieString } from "~/utils/cookies";
import { type IncomingRequest } from "~/utils/request";

const log = logger.child({ module: "monitor" });

interface ProtoEvent {
  timestamp: Date;
  type: "notify";
  userId: string;
  name: string;
  loadTime?: number;
}

interface ErrorMeta {
  path?: string;
  procedure?: string;
  statusCode?: number;
  userId?: string;
  sessionId?: string;
  properties?: unknown;
}

interface CaptureError extends ErrorMeta {
  error: unknown;
}

interface ProtoError extends ErrorMeta {
  timestamp: Date;
  hash: string;
  type: string;
  message?: string;
  stack?: string;
}

function shortStack(stack: string, maxLines = 5) {
  return stack.split("\n").slice(0, maxLines).join("\n");
}

function simpleHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

class MonitoringService {
  private events: ProtoEvent[] = [];
  private errors: ProtoError[] = [];

  push(event: Omit<ProtoEvent, "timestamp">) {
    this.events.push({
      ...event,
      timestamp: new Date(),
    });
  }

  captureWithReq(
    error: unknown,
    req: IncomingRequest,
    meta: {
      statusCode?: number;
      procedure?: string;
      userId?: string;
      properties?: Record<string, unknown>;
    } = {}
  ) {
    const cookies = parseMtCookieString(req.cookie);
    this.capture({
      error,
      path: req.getUrl().pathname,
      statusCode: meta.statusCode,
      userId: meta.userId ?? cookies.userId ?? undefined,
      sessionId: cookies.sessionId ?? undefined,
      procedure: meta.procedure,
      properties: meta.properties,
    });
  }

  capture(data: CaptureError) {
    const { error, ...rest } = data;
    const err = error instanceof Error ? error : new Error("Unknown error");

    this._capture({
      ...rest,
      type: err.name,
      message: err.message,
      stack: err.stack,
    });
  }

  private _capture(error: Omit<ProtoError, "timestamp" | "hash">) {
    error = { ...error, stack: shortStack(error.stack ?? "") };
    log.error({ err: error }, "capturing");
    const hash = this.hashError(error);
    this.errors.push({
      ...error,
      timestamp: new Date(),
      hash,
    });
  }

  /**
   * Creates a hash of (path, procedure, type, message, stack) for identifying
   * unique errors.
   * Uses browser crypto APIs as this runs in the edge (browser) runtime.
   * Uses a simple hash function as this is not a security-sensitive context.
   */
  private hashError(error: Omit<ProtoError, "timestamp" | "hash">) {
    const text = [
      error.path ?? "",
      error.procedure ?? "",
      error.type ?? "",
      error.message ?? "",
    ].join("");
    return simpleHash(text);
  }

  async flush() {
    await Promise.all([this.flushEvents(), this.flushErrors()]);
  }

  private async flushEvents() {
    if (this.events.length === 0) return;

    await mdb.insert(mschema.event).values(
      this.events.map((e) => ({
        timestamp: db_utils.dateToSqlDateTime(e.timestamp),
        type: e.type,
        isAnonymous: false,
        userId: e.userId,
        name: e.name,
        loadTime: e.loadTime,
      }))
    );
    log.debug({ count: this.events.length }, "flushed events");
    this.events = [];
  }

  private async flushErrors() {
    if (this.errors.length === 0) return;

    await mdb.insert(mschema.issue).values(
      this.errors.map((e) => ({
        timestamp: db_utils.dateToSqlDateTime(e.timestamp),
        appVersion: env.NEXT_PUBLIC_DEPLOY_ID,

        hash: e.hash,
        path: e.path,
        procedure: e.procedure,
        type: e.type,
        message: e.message,
        stack: e.stack,
        statusCode: e.statusCode,
        userId: e.userId,
        sessionId: e.sessionId,

        properties: e.properties,
      }))
    );
    log.debug({ count: this.errors.length }, "flushed errors");
    this.errors = [];
  }
}

const globalMonitoring = globalThis as unknown as {
  monitoring: MonitoringService;
};

export const monitor = globalMonitoring.monitoring ?? new MonitoringService();
