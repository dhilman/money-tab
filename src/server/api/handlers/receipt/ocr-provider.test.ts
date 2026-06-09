import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mockGenerateText = vi.fn();
const mockCreateOpenRouter = vi.fn();

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");
  return {
    ...actual,
    generateText: (...args: unknown[]) => mockGenerateText(...args),
  };
});

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: (...args: unknown[]) => mockCreateOpenRouter(...args),
}));

vi.mock("~/env.mjs", () => ({
  env: {
    get OPENROUTER_API_KEY() {
      return process.env.__TEST_OPENROUTER_KEY;
    },
  },
}));

const SAMPLE_OUTPUT = {
  merchant: "Joe's Diner",
  date: "2026-04-26",
  currency_code: "USD",
  total: 4500,
  subtotal: 4000,
  tax: 500,
  tip: null,
  service: null,
  discount: null,
  items: [{ name: "Burger", quantity: 1, unit_price: 4000, total: 4000 }],
};

beforeEach(() => {
  process.env.__TEST_OPENROUTER_KEY = "test-key";
  mockGenerateText.mockReset();
  mockCreateOpenRouter.mockReset();

  // createOpenRouter returns a function that returns a "model" object.
  // The model is opaque to our code - we only pass it to generateText.
  const fakeModel = { __mock: true };
  mockCreateOpenRouter.mockReturnValue(() => fakeModel);
  mockGenerateText.mockResolvedValue({ output: SAMPLE_OUTPUT });
});

afterEach(() => {
  delete process.env.__TEST_OPENROUTER_KEY;
});

describe("parseReceipt", () => {
  test("throws when OPENROUTER_API_KEY is not configured", async () => {
    delete process.env.__TEST_OPENROUTER_KEY;
    const { parseReceipt } = await import("./ocr-provider");
    await expect(
      parseReceipt({ imageData: "iVBORw0KGgo=", mediaType: "image/png" }),
    ).rejects.toThrow(/OPENROUTER_API_KEY is not configured/);
  });

  test("constructs OpenRouter provider with the api key", async () => {
    const { parseReceipt } = await import("./ocr-provider");
    await parseReceipt({ imageData: "iVBORw0KGgo=", mediaType: "image/png" });
    expect(mockCreateOpenRouter).toHaveBeenCalledWith({ apiKey: "test-key" });
  });

  test("encodes base64 image data as a data URI", async () => {
    const { parseReceipt } = await import("./ocr-provider");
    await parseReceipt({ imageData: "BASE64DATA", mediaType: "image/png" });

    const call = mockGenerateText.mock.calls[0]![0];
    const userMessage = call.messages.find((m: { role: string }) => m.role === "user");
    const imagePart = userMessage.content.find(
      (p: { type: string }) => p.type === "image",
    );
    expect(imagePart.image).toBe("data:image/png;base64,BASE64DATA");
  });

  test("passes through http(s) URLs without wrapping in data URI", async () => {
    const { parseReceipt } = await import("./ocr-provider");
    await parseReceipt({ imageData: "https://example.com/r.jpg" });

    const call = mockGenerateText.mock.calls[0]![0];
    const userMessage = call.messages.find((m: { role: string }) => m.role === "user");
    const imagePart = userMessage.content.find(
      (p: { type: string }) => p.type === "image",
    );
    expect(imagePart.image).toBe("https://example.com/r.jpg");
  });

  test("defaults media type to image/jpeg when not provided", async () => {
    const { parseReceipt } = await import("./ocr-provider");
    await parseReceipt({ imageData: "BASE64DATA" });

    const call = mockGenerateText.mock.calls[0]![0];
    const userMessage = call.messages.find((m: { role: string }) => m.role === "user");
    const imagePart = userMessage.content.find(
      (p: { type: string }) => p.type === "image",
    );
    expect(imagePart.image).toBe("data:image/jpeg;base64,BASE64DATA");
  });

  test("appends the currency hint to the user prompt", async () => {
    const { parseReceipt } = await import("./ocr-provider");
    await parseReceipt({
      imageData: "BASE64DATA",
      mediaType: "image/png",
      currencyHint: "EUR",
    });

    const call = mockGenerateText.mock.calls[0]![0];
    const userMessage = call.messages.find((m: { role: string }) => m.role === "user");
    const textPart = userMessage.content.find(
      (p: { type: string }) => p.type === "text",
    );
    expect(textPart.text).toContain("EUR");
  });

  test("omits the currency hint when not provided", async () => {
    const { parseReceipt } = await import("./ocr-provider");
    await parseReceipt({ imageData: "BASE64DATA", mediaType: "image/png" });

    const call = mockGenerateText.mock.calls[0]![0];
    const userMessage = call.messages.find((m: { role: string }) => m.role === "user");
    const textPart = userMessage.content.find(
      (p: { type: string }) => p.type === "text",
    );
    expect(textPart.text).not.toMatch(/expected currency/i);
  });

  test("forwards the system prompt with cents/tax rules", async () => {
    const { parseReceipt } = await import("./ocr-provider");
    await parseReceipt({ imageData: "BASE64DATA", mediaType: "image/png" });

    const call = mockGenerateText.mock.calls[0]![0];
    const systemMessage = call.messages.find(
      (m: { role: string }) => m.role === "system",
    );
    expect(systemMessage.content).toMatch(/CENTS/);
    expect(systemMessage.content).toMatch(/TAX HANDLING/);
  });

  test("returns parsed receipt with latency", async () => {
    const { parseReceipt } = await import("./ocr-provider");
    const result = await parseReceipt({
      imageData: "BASE64DATA",
      mediaType: "image/png",
    });
    expect(result.receipt).toEqual(SAMPLE_OUTPUT);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test("wraps SDK errors with 'Failed to parse receipt:' prefix", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("upstream 503"));
    const { parseReceipt } = await import("./ocr-provider");
    await expect(
      parseReceipt({ imageData: "BASE64DATA", mediaType: "image/png" }),
    ).rejects.toThrow(/Failed to parse receipt: upstream 503/);
  });
});
