"use client";

import { AlertCircleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import type { ReceiptItem } from "~/lib/receipt";
import { cn } from "~/lib/utils";
import { ParticipantChipGroup } from "./participant-chip";
import { useReceiptCtx } from "./receipt-context";

/**
 * List of receipt items with participant assignment chips.
 * Shows item name, price, and toggleable participant avatars.
 */
export const ReceiptItemList = () => {
  const { t } = useTranslation();
  const { receipt, assignments, toggleItemAssignment, unassignedItems } =
    useReceiptCtx();
  const { parties } = useParticipantsCtx();

  if (!receipt?.items.length) {
    return null;
  }

  const participantIds = parties.map((p) => p.id);
  const currencyCode = receipt.currencyCode ?? "USD";

  const getSelectedForItem = (itemId: string): string[] => {
    const assignment = assignments.find((a) => a.itemId === itemId);
    if (!assignment) return [];
    return Object.entries(assignment.shares)
      .filter(([, count]) => count > 0)
      .map(([userId]) => userId);
  };

  const isUnassigned = (itemId: string): boolean => {
    return unassignedItems.some((item) => item.id === itemId);
  };

  return (
    <div className="space-y-2">
      <h3 className="px-1 text-sm font-medium text-hint">
        {t("receipt.items_count", { count: receipt.items.length })}
      </h3>
      <div className="space-y-2">
        {receipt.items.map((item) => (
          <ReceiptItemRow
            key={item.id}
            item={item}
            currencyCode={currencyCode}
            participantIds={participantIds}
            selectedIds={getSelectedForItem(item.id)}
            onToggle={(userId) => toggleItemAssignment(item.id, userId)}
            isUnassigned={isUnassigned(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface ReceiptItemRowProps {
  item: ReceiptItem;
  currencyCode: string;
  participantIds: string[];
  selectedIds: string[];
  onToggle: (userId: string) => void;
  isUnassigned: boolean;
}

const ReceiptItemRow = ({
  item,
  currencyCode,
  participantIds,
  selectedIds,
  onToggle,
  isUnassigned,
}: ReceiptItemRowProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-hint/10 bg-background p-3",
        isUnassigned && "border-orange-500/50",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {isUnassigned && (
              <AlertCircleIcon className="h-4 w-4 shrink-0 text-orange-500" />
            )}
            <p className="truncate text-sm font-medium">{item.name}</p>
          </div>
          {item.quantity && item.quantity > 1 && (
            <p className="text-xs text-hint">x{item.quantity}</p>
          )}
        </div>
        <p className="shrink-0 text-sm font-medium text-primary">
          {formatAmountCurrency(item.total, currencyCode)}
        </p>
      </div>
      <ParticipantChipGroup
        participantIds={participantIds}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
};
