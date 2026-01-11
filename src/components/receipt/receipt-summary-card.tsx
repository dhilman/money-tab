"use client";

import { CalendarIcon, ReceiptIcon, StoreIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import { cn } from "~/lib/utils";
import { useReceiptCtx } from "./receipt-context";
import { useApplyReceipt } from "./use-apply-receipt";

interface ReceiptSummaryCardProps {
  /** Called when "Split by Items" is clicked (opens drawer) */
  onSplitByItems?: () => void;
}

/**
 * Card showing parsed receipt summary with action buttons.
 * - "Use Total" applies the total amount to the transaction (fast path)
 * - "Split by Items" opens the itemized split drawer (power path)
 */
export const ReceiptSummaryCard = ({
  onSplitByItems,
}: ReceiptSummaryCardProps) => {
  const { t } = useTranslation();
  const { receipt, clearReceipt } = useReceiptCtx();
  const { applyToTransaction } = useApplyReceipt();

  if (!receipt) return null;

  const currencyCode = receipt.currencyCode ?? "USD";
  const hasItems = receipt.items.length > 0;

  const handleUseTotal = () => {
    applyToTransaction();
    clearReceipt();
  };

  const handleSplitByItems = () => {
    onSplitByItems?.();
  };

  return (
    <Bento>
      <BentoContent className="relative p-4">
        {/* Close button */}
        <button
          onClick={clearReceipt}
          className="absolute top-2 right-2 rounded-full p-1.5 text-hint hover:bg-hint/10"
        >
          <XIcon className="h-4 w-4" />
        </button>

        {/* Receipt icon and total */}
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ReceiptIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm text-hint">{t("receipt.scanned")}</p>
            {receipt.total && (
              <p className="text-xl font-semibold text-primary">
                {formatAmountCurrency(receipt.total, currencyCode)}
              </p>
            )}
          </div>
        </div>

        {/* Metadata rows */}
        <div className="space-y-1.5 text-sm">
          {receipt.merchant && (
            <div className="flex items-center gap-2 text-secondary">
              <StoreIcon className="h-4 w-4 text-hint" />
              <span>{receipt.merchant}</span>
            </div>
          )}
          {receipt.date && (
            <div className="flex items-center gap-2 text-secondary">
              <CalendarIcon className="h-4 w-4 text-hint" />
              <span>{formatDate(receipt.date)}</span>
            </div>
          )}
          {hasItems && (
            <p className="text-hint">
              {t("receipt.items_count", { count: receipt.items.length })}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleUseTotal}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-medium",
              "bg-button text-button-text",
            )}
          >
            {t("receipt.use_total")}
          </button>
          {hasItems && (
            <button
              onClick={handleSplitByItems}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium",
                "bg-hint/10 text-primary",
              )}
            >
              {t("receipt.split_by_items")}
            </button>
          )}
        </div>
      </BentoContent>
    </Bento>
  );
};

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}
