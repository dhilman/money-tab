import { useCallback } from "react";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { useTxEditCtx } from "~/components/pages/tx/form/tx-form-ctx";
import { useReceiptCtx } from "./receipt-context";

/**
 * Hook to apply receipt data to the transaction form.
 *
 * - Fast path (splitEnabled = false): Just fills amount, description, date
 * - Power path (splitEnabled = true): Sets per-person amounts from personTotals
 */
export function useApplyReceipt() {
  const { receipt, splitEnabled, personTotals } = useReceiptCtx();
  const txEdit = useTxEditCtx();
  const participants = useParticipantsCtx();

  const applyToTransaction = useCallback(() => {
    if (!receipt) return;

    // Set transaction-level fields
    if (receipt.total) {
      txEdit.setAmount(receipt.total);
    }
    if (receipt.merchant) {
      txEdit.setDescription(receipt.merchant);
    }
    if (receipt.date) {
      txEdit.setDate(receipt.date);
    }

    // If itemized split is enabled, set per-person amounts
    if (splitEnabled && personTotals.length > 0) {
      for (const personTotal of personTotals) {
        participants.setAmount(personTotal.userId, personTotal.total);
      }
    }
  }, [receipt, splitEnabled, personTotals, txEdit, participants]);

  return { applyToTransaction };
}
