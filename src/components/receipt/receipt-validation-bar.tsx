"use client";

import { AlertTriangleIcon, CheckCircleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import { cn } from "~/lib/utils";
import { useReceiptCtx } from "./receipt-context";

/**
 * Validation bar showing warnings for unassigned items or total mismatches.
 * Displays success state when everything is valid.
 */
export const ReceiptValidationBar = () => {
  const { t } = useTranslation();
  const { receipt, unassignedItems, totalsDifference, isValid } =
    useReceiptCtx();

  const currencyCode = receipt?.currencyCode ?? "USD";

  // Show success state when valid
  if (isValid) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2">
        <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-500" />
        <span className="text-sm text-green-700 dark:text-green-400">
          {t("receipt.validation.ready")}
        </span>
      </div>
    );
  }

  // Collect warnings
  const warnings: string[] = [];

  if (unassignedItems.length > 0) {
    warnings.push(
      t("receipt.validation.unassigned_items", {
        count: unassignedItems.length,
      }),
    );
  }

  if (totalsDifference !== 0) {
    const diff = formatAmountCurrency(Math.abs(totalsDifference), currencyCode);
    if (totalsDifference > 0) {
      warnings.push(t("receipt.validation.over_total", { amount: diff }));
    } else {
      warnings.push(t("receipt.validation.under_total", { amount: diff }));
    }
  }

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2",
        "bg-orange-500/10",
      )}
    >
      <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
      <div className="space-y-0.5">
        {warnings.map((warning, i) => (
          <p key={i} className="text-sm text-orange-700 dark:text-orange-400">
            {warning}
          </p>
        ))}
      </div>
    </div>
  );
};
