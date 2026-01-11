/**
 * Receipt parsing handler.
 *
 * Takes an image URL (from S3), fetches it, and parses using OCR.
 */

import { TRPCError } from "@trpc/server";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { env } from "~/env.mjs";
import type { ReceiptItem, ReceiptParse } from "~/lib/receipt/types";
import { privateProcedure } from "~/server/api/trpc";
import { parseReceipt } from "./ocr-provider";

const input = z.object({
  /** URL of the receipt image (from S3 upload) */
  fileUrl: z.string().url(),
  /** Optional currency hint to improve parsing accuracy */
  currencyCode: z.string().length(3).optional(),
});

export const receiptParseHandler = privateProcedure
  .input(input)
  .mutation(async ({ input }): Promise<ReceiptParse> => {
    console.log("[receipt.parse] Starting parse for:", input.fileUrl);

    // Validate URL is from our S3 bucket (prevent SSRF)
    if (!input.fileUrl.startsWith(env.S3_URL)) {
      console.log(
        "[receipt.parse] URL validation failed. Expected prefix:",
        env.S3_URL,
      );
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid file URL",
      });
    }

    // Fetch the image from S3 with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let imageResponse: Response;
    try {
      imageResponse = await fetch(input.fileUrl, { signal: controller.signal });
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch image",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!imageResponse.ok) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Image not found",
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageData = Buffer.from(imageBuffer).toString("base64");
    console.log(
      "[receipt.parse] Image fetched, size:",
      imageBuffer.byteLength,
      "bytes",
    );

    // Determine media type from content-type header or URL
    let mediaType = imageResponse.headers.get("content-type") ?? "image/jpeg";
    if (mediaType === "application/octet-stream") {
      // Fallback based on URL extension
      const ext = input.fileUrl.split(".").pop()?.toLowerCase();
      mediaType =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";
    }

    // Parse the receipt
    let result;
    try {
      result = await parseReceipt({
        imageData,
        mediaType,
        currencyHint: input.currencyCode,
      });
    } catch (err) {
      console.error("Receipt parsing failed:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err instanceof Error ? err.message : "Failed to parse receipt",
      });
    }

    // Transform to our ReceiptParse type with IDs
    // Filter out items without totals (they're not useful for splitting)
    const items: ReceiptItem[] = (result.receipt.items ?? [])
      .filter((item) => item.total != null)
      .map((item) => ({
        id: createId(),
        name: item.name,
        quantity: item.quantity ?? undefined,
        unitPrice: item.unit_price ?? undefined,
        total: item.total!,
      }));

    return {
      sourceUrl: input.fileUrl,
      merchant: result.receipt.merchant ?? undefined,
      date: result.receipt.date ?? undefined,
      currencyCode: result.receipt.currency_code ?? undefined,
      total: result.receipt.total ?? undefined,
      subtotal: result.receipt.subtotal ?? undefined,
      tax: result.receipt.tax ?? undefined,
      tip: result.receipt.tip ?? undefined,
      service: result.receipt.service ?? undefined,
      discount: result.receipt.discount ?? undefined,
      items,
    };
  });
