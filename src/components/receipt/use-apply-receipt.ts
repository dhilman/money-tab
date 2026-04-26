import { useCallback } from "react";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { useTxEditCtx } from "~/components/pages/tx/form/tx-form-ctx";
import { getCurrencyByCode } from "~/lib/amount/currencies";
import { useReceiptCtx } from "./receipt-context";

/**
 * Hook to apply receipt data to the transaction form.
 *
 * - Fast path (splitEnabled = false): Just fills amount, description, date
 * - Power path (splitEnabled = true): Sets per-person amounts from personTotals
 * - Always adds receipt image as attachment
 */
export function useApplyReceipt() {
  const { receipt, receiptFile, splitEnabled, personTotals } = useReceiptCtx();
  const txEdit = useTxEditCtx();
  const participants = useParticipantsCtx();

  const applyToTransaction = useCallback(() => {
    if (!receipt) return;

    // Set transaction-level fields
    if (receipt.total) {
      txEdit.setAmount(receipt.total);
    }
    if (receipt.currencyCode) {
      const currency = getCurrencyByCode(receipt.currencyCode);
      if (currency) {
        txEdit.setCurrency(currency);
      }
    }
    if (receipt.merchant) {
      txEdit.setDescription(receipt.merchant);
    }
    if (receipt.date) {
      txEdit.setDate(receipt.date);
    }

    // Add receipt image as attachment
    if (receiptFile) {
      txEdit.setFiles((prev) => {
        // Avoid duplicates
        if (prev.some((f) => f.id === receiptFile.id)) return prev;
        return [...prev, receiptFile];
      });
    }

    // Itemized split: write per-person amounts directly into the "amount" bucket.
    // Pass mode explicitly — setSplitMode's state update isn't visible to subsequent
    // setSplitValue calls in the same tick, so relying on closured state.splitMode
    // would route values into the wrong bucket if the user was in shares/percentage mode.
    if (splitEnabled && personTotals.length > 0) {
      participants.setSplitMode("amount");
      for (const personTotal of personTotals) {
        participants.setSplitValue(
          personTotal.userId,
          personTotal.total,
          "amount",
        );
      }
    }
  }, [receipt, receiptFile, splitEnabled, personTotals, txEdit, participants]);

  return { applyToTransaction };
}
