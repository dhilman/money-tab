import { useCallback } from "react";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { useTxEditCtx } from "~/components/pages/tx/form/tx-form-ctx";
import { getCurrencyByCode } from "~/lib/amount/currencies";
import type { ReceiptParse } from "~/lib/receipt";
import type { Attachment } from "~/components/form/file-input";
import { useReceiptCtx } from "./receipt-context";

/**
 * Hook to apply receipt scan results to the form. Called from the scan
 * affordance when OCR completes. Auto-fills tx-level fields, attaches the
 * receipt image, switches the participants split mode to "itemized", and
 * stores the parsed receipt in the receipt context for inline editing.
 */
export function useApplyReceiptScan() {
  const txEdit = useTxEditCtx();
  const participants = useParticipantsCtx();
  const { setReceipt } = useReceiptCtx();

  return useCallback(
    (receipt: ReceiptParse, file: Attachment | null) => {
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
      if (file) {
        txEdit.setFiles((prev) => {
          if (prev.some((f) => f.id === file.id)) return prev;
          return [...prev, file];
        });
      }

      setReceipt(receipt, file);
      participants.setSplitMode("itemized");
    },
    [txEdit, participants, setReceipt],
  );
}
