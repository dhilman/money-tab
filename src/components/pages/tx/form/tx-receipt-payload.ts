import type { SplitMode } from "~/components/common/participants/reducer";
import type { ReceiptData } from "~/lib/receipt";

interface ReceiptCtxPayload {
  receipt: ReceiptData["receipt"] | null;
  assignments: ReceiptData["assignments"];
  extras: ReceiptData["extras"];
}

/**
 * The split mode a receiptData blob round-trips through persistence. Only the
 * itemized/non-itemized distinction survives a save: percentage and shares
 * values are not persisted, so those modes coarsen to "amount". Legacy blobs
 * without splitMode could only have been saved from itemized mode.
 */
export function persistedSplitMode(
  splitMode: SplitMode | undefined,
): "itemized" | "amount" {
  return (splitMode ?? "itemized") === "itemized" ? "itemized" : "amount";
}

/**
 * Build the persisted receiptData payload for tx create/update.
 * Whenever a scanned receipt exists, the blob is persisted with the current
 * split mode embedded (coarsened via persistedSplitMode) — switching to a
 * non-itemized split must not discard the receipt. Returns null only when no
 * receipt has been scanned.
 */
export function buildReceiptDataPayload(
  splitMode: SplitMode,
  receiptCtx: ReceiptCtxPayload | null,
): ReceiptData | null {
  if (!receiptCtx?.receipt) return null;
  return {
    receipt: receiptCtx.receipt,
    assignments: receiptCtx.assignments,
    extras: receiptCtx.extras,
    splitMode: persistedSplitMode(splitMode),
  };
}

/** Whether the Save button must stay disabled because itemized data is incomplete. */
export function isItemizedAndInvalid(
  splitMode: SplitMode,
  receiptCtx: { isValid: boolean } | null,
): boolean {
  return splitMode === "itemized" && !(receiptCtx?.isValid ?? false);
}
