import { describe, expect, test } from "vitest";
import { receiptDataEqual } from "./equal";
import type { ReceiptData } from "./types";

describe("receiptDataEqual", () => {
  test("null/null is equal", () => {
    expect(receiptDataEqual(null, null)).toBe(true);
  });

  test("null vs object is not equal", () => {
    expect(receiptDataEqual(null, {})).toBe(false);
    expect(receiptDataEqual({}, null)).toBe(false);
  });

  test("structurally equal objects are equal regardless of key order", () => {
    // Simulates a Postgres jsonb round-trip where the read-back order may
    // differ from what the client sent.
    const original: ReceiptData = {
      receipt: {
        sourceUrl: "https://x",
        merchant: "M",
        currencyCode: "USD",
        total: 1000,
        items: [{ id: "i1", name: "thing", total: 1000 }],
      },
      assignments: [{ itemId: "i1", shares: { u1: 1, u2: 1 } }],
      extras: [],
    };
    const reordered = {
      assignments: [{ shares: { u2: 1, u1: 1 }, itemId: "i1" }],
      extras: [],
      receipt: {
        items: [{ total: 1000, name: "thing", id: "i1" }],
        currencyCode: "USD",
        merchant: "M",
        sourceUrl: "https://x",
        total: 1000,
      },
    };
    expect(receiptDataEqual(original, reordered)).toBe(true);
  });

  test("blobs differing only in splitMode are not equal", () => {
    const base: ReceiptData = {
      receipt: {
        sourceUrl: "https://x",
        items: [{ id: "i1", name: "thing", total: 1000 }],
      },
      assignments: [{ itemId: "i1", shares: { u1: 1 } }],
      extras: [],
      splitMode: "itemized",
    };
    expect(receiptDataEqual(base, { ...base, splitMode: "amount" })).toBe(
      false,
    );
    expect(receiptDataEqual(base, { ...base })).toBe(true);
  });

  test("different array order is not equal", () => {
    expect(receiptDataEqual([1, 2, 3], [3, 2, 1])).toBe(false);
  });

  test("missing key is not equal", () => {
    expect(receiptDataEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    expect(receiptDataEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
  });

  test("primitive equality", () => {
    expect(receiptDataEqual(1, 1)).toBe(true);
    expect(receiptDataEqual("a", "a")).toBe(true);
    expect(receiptDataEqual(1, "1")).toBe(false);
    expect(receiptDataEqual(true, true)).toBe(true);
  });
});
