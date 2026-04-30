import type { SplitMode } from "~/components/common/participants/reducer";
import type { ReceiptData } from "~/lib/receipt";

interface ReceiptCtxPayload {
  receipt: ReceiptData["receipt"] | null;
  assignments: ReceiptData["assignments"];
  extras: ReceiptData["extras"];
}

/**
 * Build the persisted receiptData payload for tx create/update.
 * Returns null unless the form is in itemized mode with a scanned receipt.
 */
export function buildReceiptDataPayload(
  splitMode: SplitMode,
  receiptCtx: ReceiptCtxPayload | null,
): ReceiptData | null {
  if (splitMode !== "itemized") return null;
  if (!receiptCtx?.receipt) return null;
  return {
    receipt: receiptCtx.receipt,
    assignments: receiptCtx.assignments,
    extras: receiptCtx.extras,
  };
}

/** Whether the Save button must stay disabled because itemized data is incomplete. */
export function isItemizedAndInvalid(
  splitMode: SplitMode,
  receiptCtx: { isValid: boolean } | null,
): boolean {
  return splitMode === "itemized" && !(receiptCtx?.isValid ?? false);
}
