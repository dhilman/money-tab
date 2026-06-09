import type { NextApiResponse } from "next";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ParseReceiptResult } from "~/server/api/handlers/receipt/ocr-provider";
import type { IncomingRequest } from "~/utils/request";
import { createCallerUser } from "./utils";

const fakeReq = {
  cookie: "",
  getUrl: () => new URL("http://localhost:3000/"),
  getHeader: () => null,
} as IncomingRequest;
const fakeRes = {} as NextApiResponse;

vi.mock("~/server/api/handlers/receipt/ocr-provider", () => ({
  parseReceipt: vi.fn(),
}));

const { parseReceipt } = await import("~/server/api/handlers/receipt/ocr-provider");
const mockParseReceipt = vi.mocked(parseReceipt);

const VALID_URL = "https://s3.amazonaws.com/bucket/prefix/abc.jpg";

const PARSED: ParseReceiptResult = {
  latencyMs: 50,
  receipt: {
    merchant: "Joe's Diner",
    date: "2026-04-26",
    currency_code: "USD",
    total: 4500,
    subtotal: 4000,
    tax: 500,
    tip: null,
    service: null,
    discount: null,
    items: [
      { name: "Burger", quantity: 1, unit_price: 4000, total: 4000 },
      { name: "Fries", quantity: 1, unit_price: 500, total: 500 },
    ],
  },
};

let originalFetch: typeof fetch;

function mockFetchOk(contentType = "image/jpeg") {
  globalThis.fetch = vi.fn(async () =>
    new Response(new Uint8Array([1, 2, 3]).buffer, {
      status: 200,
      headers: { "content-type": contentType },
    }),
  ) as unknown as typeof fetch;
}

beforeEach(() => {
  originalFetch = globalThis.fetch;
  mockParseReceipt.mockReset();
  mockParseReceipt.mockResolvedValue(PARSED);
  mockFetchOk();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("receipt.parse", () => {
  test("rejects URLs not from configured S3 bucket (SSRF prevention)", async () => {
    const { caller } = await createCallerUser();
    await expect(
      caller.receipt.parse({ fileUrl: "https://evil.example.com/r.jpg" }),
    ).rejects.toThrow(/Invalid file URL/);
    expect(mockParseReceipt).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test("rejects URLs that share a prefix but a different host (SSRF prefix bypass)", async () => {
    // S3_URL in vitest config is "https://s3.amazonaws.com" — a naive startsWith
    // check would let this through. Origin compare must reject it.
    const { caller } = await createCallerUser();
    await expect(
      caller.receipt.parse({
        fileUrl: "https://s3.amazonaws.com.evil.com/r.jpg",
      }),
    ).rejects.toThrow(/Invalid file URL/);
    expect(mockParseReceipt).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test("rejects malformed URLs", async () => {
    const { caller } = await createCallerUser();
    await expect(
      caller.receipt.parse({ fileUrl: "not a url" }),
    ).rejects.toThrow();
    expect(mockParseReceipt).not.toHaveBeenCalled();
  });

  test("returns parsed receipt with item IDs and merchant info", async () => {
    const { caller } = await createCallerUser();
    const result = await caller.receipt.parse({ fileUrl: VALID_URL });

    expect(result.merchant).toBe("Joe's Diner");
    expect(result.total).toBe(4500);
    expect(result.subtotal).toBe(4000);
    expect(result.tax).toBe(500);
    expect(result.currencyCode).toBe("USD");
    expect(result.sourceUrl).toBe(VALID_URL);
    expect(result.items).toHaveLength(2);
    for (const item of result.items) {
      expect(item.id).toMatch(/.+/);
      expect(item.total).toBeGreaterThan(0);
    }
  });

  test("filters out items without a total", async () => {
    mockParseReceipt.mockResolvedValueOnce({
      ...PARSED,
      receipt: {
        ...PARSED.receipt,
        items: [
          { name: "Burger", quantity: 1, unit_price: 4000, total: 4000 },
          { name: "Mystery", quantity: 1, unit_price: null, total: null },
        ],
      },
    });
    const { caller } = await createCallerUser();
    const result = await caller.receipt.parse({ fileUrl: VALID_URL });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.name).toBe("Burger");
  });

  test("forwards currency hint to the OCR provider", async () => {
    const { caller } = await createCallerUser();
    await caller.receipt.parse({ fileUrl: VALID_URL, currencyCode: "GBP" });

    expect(mockParseReceipt).toHaveBeenCalledTimes(1);
    expect(mockParseReceipt.mock.calls[0]![0].currencyHint).toBe("GBP");
  });

  test("infers media type from URL extension when content-type is octet-stream", async () => {
    mockFetchOk("application/octet-stream");
    const { caller } = await createCallerUser();
    await caller.receipt.parse({
      fileUrl: "https://s3.amazonaws.com/bucket/r.png",
    });
    expect(mockParseReceipt.mock.calls[0]![0].mediaType).toBe("image/png");
  });

  test("propagates 404 from S3 fetch as BAD_REQUEST", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 404 }),
    ) as unknown as typeof fetch;
    const { caller } = await createCallerUser();
    await expect(
      caller.receipt.parse({ fileUrl: VALID_URL }),
    ).rejects.toThrow(/Image not found/);
    expect(mockParseReceipt).not.toHaveBeenCalled();
  });

  test("wraps OCR provider failure as INTERNAL_SERVER_ERROR", async () => {
    mockParseReceipt.mockRejectedValueOnce(new Error("upstream 503"));
    const { caller } = await createCallerUser();
    await expect(
      caller.receipt.parse({ fileUrl: VALID_URL }),
    ).rejects.toThrow(/upstream 503/);
  });

  test("rejects when fetch throws (network error)", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;
    const { caller } = await createCallerUser();
    await expect(
      caller.receipt.parse({ fileUrl: VALID_URL }),
    ).rejects.toThrow(/Failed to fetch image/);
    expect(mockParseReceipt).not.toHaveBeenCalled();
  });

  test("requires a logged-in user (privateProcedure)", async () => {
    const { createCaller } = await import("~/server/api/root");
    const { db } = await import("~/server/db");
    const caller = createCaller({
      db,
      req: fakeReq,
      res: fakeRes,
      userId: null,
      user: null,
    });
    await expect(
      caller.receipt.parse({ fileUrl: VALID_URL }),
    ).rejects.toThrow();
    expect(mockParseReceipt).not.toHaveBeenCalled();
  });
});

describe("receipt.parse without OPENROUTER_API_KEY", () => {
  test("returns PRECONDITION_FAILED when key is missing", async () => {
    vi.resetModules();
    vi.doMock("~/env.mjs", async () => {
      const actual = await vi.importActual<typeof import("~/env.mjs")>("~/env.mjs");
      return {
        env: { ...actual.env, OPENROUTER_API_KEY: undefined },
      };
    });

    const { createCaller } = await import("~/server/api/root");
    const { db, mutate } = await import("~/server/db");
    const user = await mutate.user.create(
      { db },
      { telegramId: Math.floor(Math.random() * 1000000), firstName: "X" },
    );
    const caller = createCaller({
      db,
      req: fakeReq,
      res: fakeRes,
      userId: user.id,
      user,
    });

    await expect(
      caller.receipt.parse({ fileUrl: VALID_URL }),
    ).rejects.toThrow(/Receipt OCR is not configured/);

    vi.doUnmock("~/env.mjs");
    vi.resetModules();
  });
});
