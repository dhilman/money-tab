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
    // Fail fast if OCR isn't configured for this deployment (Coolify/etc.
    // may run without OPENROUTER_API_KEY set). Avoids fetching from S3 only
    // to error inside the OCR call.
    if (!env.OPENROUTER_API_KEY) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Receipt OCR is not configured",
      });
    }

    // Validate URL origin and path prefix match our S3 bucket (prevent SSRF).
    // startsWith() on the raw string would let
    // "https://s3.amazonaws.com.evil.com/..." pass when S3_URL is
    // "https://s3.amazonaws.com" — origin compare blocks that. The path check
    // matters for path-style buckets (e.g. MinIO) where S3_URL includes the
    // bucket path; the prefix is slash-terminated so "/bucketevil" can't pass
    // as "/bucket".
    let parsed: URL;
    try {
      parsed = new URL(input.fileUrl);
    } catch {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid file URL" });
    }
    const s3Url = new URL(env.S3_URL);
    if (parsed.origin !== s3Url.origin) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid file URL" });
    }
    if (s3Url.pathname !== "/") {
      const pathPrefix = s3Url.pathname.endsWith("/")
        ? s3Url.pathname
        : `${s3Url.pathname}/`;
      if (!parsed.pathname.startsWith(pathPrefix)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid file URL",
        });
      }
    }

    // Fetch the image from S3 with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let imageResponse: Response;
    try {
      imageResponse = await fetch(input.fileUrl, { signal: controller.signal });
    } catch {
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

    // Items without a total are useless for splitting — drop them.
    const items: ReceiptItem[] = (result.receipt.items ?? [])
      .filter(
        (item): item is typeof item & { total: number } => item.total != null,
      )
      .map((item) => ({
        id: createId(),
        name: item.name,
        quantity: item.quantity ?? undefined,
        unitPrice: item.unit_price ?? undefined,
        total: item.total,
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
