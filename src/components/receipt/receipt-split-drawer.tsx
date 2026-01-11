"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { cn } from "~/lib/utils";
import { ReceiptExtrasSection } from "./receipt-extras-section";
import { ReceiptItemList } from "./receipt-item-list";
import { ReceiptTotalsPreview } from "./receipt-totals-preview";
import { ReceiptValidationBar } from "./receipt-validation-bar";
import { useReceiptCtx } from "./receipt-context";
import { useApplyReceipt } from "./use-apply-receipt";

interface ReceiptSplitDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Drawer for itemized receipt splitting.
 * Shows items with participant assignment, extras allocation, and per-person totals.
 */
export const ReceiptSplitDrawer = ({
  open,
  onOpenChange,
}: ReceiptSplitDrawerProps) => {
  const { t } = useTranslation();
  const { receipt, canApply, clearReceipt, setSplitEnabled } = useReceiptCtx();
  const { applyToTransaction } = useApplyReceipt();

  // Enable split mode when drawer opens (useEffect because onOpenChange isn't
  // called when programmatically opening the drawer)
  useEffect(() => {
    if (open) {
      setSplitEnabled(true);
    }
  }, [open, setSplitEnabled]);

  const handleApply = () => {
    if (!canApply) return;
    applyToTransaction();
    clearReceipt();
    onOpenChange(false);
  };

  if (!receipt) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} handleOnly>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{t("receipt.split_by_items")}</DrawerTitle>
        </DrawerHeader>

        {/* Sticky totals preview */}
        <div className="sticky top-0 z-10 bg-background px-4 pb-2">
          <ReceiptTotalsPreview />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <ReceiptItemList />
          <ReceiptExtrasSection />
        </div>

        {/* Footer with validation and apply button */}
        <DrawerFooter className="border-t border-hint/10">
          <ReceiptValidationBar />
          <button
            type="button"
            onClick={handleApply}
            disabled={!canApply}
            className={cn(
              "w-full rounded-lg py-3 text-sm font-medium transition-colors",
              canApply
                ? "bg-button text-button-text"
                : "cursor-not-allowed bg-hint/10 text-hint",
            )}
          >
            {t("receipt.apply_split")}
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
