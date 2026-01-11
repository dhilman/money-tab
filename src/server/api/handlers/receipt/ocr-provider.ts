/**
 * Receipt OCR provider using Vercel AI SDK with OpenRouter/Gemini.
 *
 * Uses the official @openrouter/ai-sdk-provider with generateText + Output.object()
 * for structured output generation.
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";
import { z } from "zod";
import { env } from "~/env.mjs";

// Zod schema for receipt parsing (matches our types but used for AI validation)
const ReceiptItemSchema = z.object({
  name: z.string().describe("Item name/description"),
  quantity: z.number().int().nullable().describe("Quantity purchased"),
  unit_price: z.number().int().nullable().describe("Price per unit in cents"),
  total: z.number().int().nullable().describe("Total price for this item in cents"),
});

const ReceiptParseSchema = z.object({
  merchant: z.string().nullable().describe("Store/merchant name"),
  date: z
    .string()
    .nullable()
    .describe("Transaction date in ISO format YYYY-MM-DD"),
  currency_code: z
    .string()
    .length(3)
    .nullable()
    .describe('Currency code like "USD", "EUR", "GBP"'),
  total: z.number().int().nullable().describe("Total amount in cents"),
  subtotal: z
    .number()
    .int()
    .nullable()
    .describe("Subtotal before tax/tip in cents"),
  tax: z.number().int().nullable().describe("Tax amount in cents"),
  tip: z.number().int().nullable().describe("Tip amount in cents"),
  service: z.number().int().nullable().describe("Service charge in cents"),
  discount: z
    .number()
    .int()
    .nullable()
    .describe("Discount amount in cents (positive value)"),
  items: z.array(ReceiptItemSchema).describe("Line items from the receipt"),
});

export type ParsedReceipt = z.infer<typeof ReceiptParseSchema>;

// Lazily create OpenRouter provider (avoids failure at import time if key missing)
function getModel() {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
  });
  return openrouter("google/gemini-3-flash-preview");
}

const SYSTEM_PROMPT = `You are a receipt parser. Extract structured data from receipt images.

CRITICAL RULES:
- ALL monetary amounts must be in CENTS (integers). Multiply by 100.
  Examples: $12.34 = 1234, £15.17 = 1517, €9.99 = 999, ¥2285 = 2285
- Each item MUST have a "total" field with an integer value
- If you cannot determine a value, use null
- Date should be in ISO format YYYY-MM-DD
- Currency code should be 3 letters (USD, EUR, GBP, JPY, etc.)
- For discounts, use positive values (the amount saved)`;

export interface ParseReceiptInput {
  /** Base64-encoded image data or URL */
  imageData: string;
  /** Media type (e.g., "image/jpeg") */
  mediaType?: string;
  /** Hint for expected currency */
  currencyHint?: string;
}

export interface ParseReceiptResult {
  receipt: ParsedReceipt;
  /** Processing time in milliseconds */
  latencyMs: number;
}

/**
 * Parse a receipt image using Gemini via OpenRouter.
 *
 * @throws Error if OPENROUTER_API_KEY is not configured
 * @throws Error if parsing fails
 */
export async function parseReceipt(
  input: ParseReceiptInput
): Promise<ParseReceiptResult> {
  const model = getModel();
  const startTime = Date.now();

  // Build the image content - support both base64 and URLs
  const imageContent = input.imageData.startsWith("http")
    ? input.imageData
    : `data:${input.mediaType ?? "image/jpeg"};base64,${input.imageData}`;

  const currencyNote = input.currencyHint
    ? ` The expected currency is ${input.currencyHint}.`
    : "";

  try {
    console.log("[receipt.ocr] Calling OpenRouter with Gemini 3 Flash...");
    console.log("[receipt.ocr] Image size:", imageContent.length, "chars");

    // Add timeout via AbortController (60 seconds)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let result;
    try {
      result = await generateText({
        model,
        output: Output.object({
          schema: ReceiptParseSchema,
        }),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image",
                image: imageContent,
              },
              {
                type: "text",
                text: `Parse this receipt image and extract all information.${currencyNote}`,
              },
            ],
          },
        ],
        abortSignal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    console.log("[receipt.ocr] Parsed successfully, output:", result.output);

    return {
      receipt: result.output!,
      latencyMs: Date.now() - startTime,
    };
  } catch (err) {
    const errMessage =
      err instanceof Error ? err.message : JSON.stringify(err);
    console.error("Receipt OCR failed:", errMessage, err);
    throw new Error(`Failed to parse receipt: ${errMessage}`);
  }
}
