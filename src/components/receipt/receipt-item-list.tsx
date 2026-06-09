"use client";

import { AlertCircleIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { useCurrencyAmountParser } from "~/components/form/amount-utils";
import { AmountField, useClickToEdit } from "~/components/form/click-to-edit";
import { useCurrencies } from "~/lib/amount/currencies";
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
  const {
    receipt,
    assignments,
    toggleItemAssignment,
    unassignedItems,
    updateItem,
    addItem,
    removeItem,
  } = useReceiptCtx();
  const { parties } = useParticipantsCtx();
  // Track the most recently added item so its name input auto-focuses.
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);

  if (!receipt) return null;

  const participantIds = parties.map((p) => p.id);
  const currencyCode = receipt.currencyCode ?? "USD";
  const unassignedIds = new Set(unassignedItems.map((i) => i.id));
  const sharesByItem = new Map(assignments.map((a) => [a.itemId, a.shares]));

  const handleAdd = () => {
    setPendingFocusId(addItem());
  };

  return (
    <div className="space-y-2">
      <h3 className="px-1 text-sm font-medium text-hint">
        {t("receipt.items_count", { count: receipt.items.length })}
      </h3>
      <div className="space-y-2">
        {receipt.items.map((item) => {
          const shares = sharesByItem.get(item.id) ?? {};
          const selectedIds = Object.entries(shares)
            .filter(([, count]) => count > 0)
            .map(([userId]) => userId);
          return (
            <ReceiptItemRow
              key={item.id}
              item={item}
              currencyCode={currencyCode}
              participantIds={participantIds}
              selectedIds={selectedIds}
              onToggle={(userId) => toggleItemAssignment(item.id, userId)}
              isUnassigned={unassignedIds.has(item.id)}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onRemove={() => removeItem(item.id)}
              autoFocus={pendingFocusId === item.id}
              onAutoFocused={() => setPendingFocusId(null)}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-hint/30 bg-background py-2 text-sm font-medium text-link hover:bg-canvas/30"
      >
        <PlusIcon className="h-4 w-4" />
        {t("receipt.add_item")}
      </button>
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
  onUpdate: (patch: Partial<Omit<ReceiptItem, "id">>) => void;
  onRemove: () => void;
  autoFocus?: boolean;
  onAutoFocused?: () => void;
}

const ReceiptItemRow = ({
  item,
  currencyCode,
  participantIds,
  selectedIds,
  onToggle,
  isUnassigned,
  onUpdate,
  onRemove,
  autoFocus,
  onAutoFocused,
}: ReceiptItemRowProps) => {
  const { t } = useTranslation();
  const currencies = useCurrencies();
  const currency = currencies[currencyCode] ?? currencies["USD"]!;
  const { decimals, parser } = useCurrencyAmountParser(currency);

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus && nameRef.current) {
      nameRef.current.focus();
      onAutoFocused?.();
    }
  }, [autoFocus, onAutoFocused]);

  const [nameDraft, setNameDraft] = useState(item.name);
  const commitName = () => {
    if (nameDraft !== item.name) onUpdate({ name: nameDraft });
  };

  const quantity = item.quantity ?? 1;
  // Unit price is purely derived from `total / quantity` for display; only the
  // total is the authoritative stored value. Editing either preserves the
  // invariant `total = quantity * unitPrice`.
  const unitPrice =
    quantity > 1
      ? (item.unitPrice ?? Math.round(item.total / quantity))
      : item.total;

  const handleTotalCommit = (v: number) => {
    if (quantity > 1) {
      onUpdate({ total: v, unitPrice: Math.round(v / quantity) });
    } else {
      onUpdate({ total: v, unitPrice: v });
    }
  };

  const handleUnitPriceCommit = (v: number) => {
    // No-op when the user committed the same value the field was displaying
    // (i.e. the `Math.round(total/qty)` derivation just above). Otherwise we'd
    // silently drop the modulo-qty cents — e.g. $10.00 / qty 3 displays $3.33,
    // and re-committing $3.33 would rewrite total to $9.99.
    if (v === unitPrice) return;
    onUpdate({ unitPrice: v, total: v * quantity });
  };

  const handleQuantityChange = (q: number) => {
    onUpdate({
      quantity: q,
      unitPrice: Math.round(item.total / Math.max(q, 1)),
    });
  };

  return (
    <div
      className={cn(
        "touch-manipulation rounded-lg border border-hint/10 bg-background p-3",
        isUnassigned && "border-orange-500/50",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            {isUnassigned && (
              <AlertCircleIcon className="h-4 w-4 shrink-0 text-orange-500" />
            )}
            <input
              ref={nameRef}
              type="text"
              value={nameDraft}
              placeholder={t("receipt.item_name")}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="min-w-0 flex-1 truncate bg-transparent text-sm font-medium outline-none placeholder:text-hint focus:border-b focus:border-primary"
            />
          </div>
          <QuantityField value={quantity} onChange={handleQuantityChange} />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <AmountField
            value={item.total}
            currencyCode={currencyCode}
            currencySymbol={currency.symbol}
            decimals={decimals}
            parse={parser}
            onCommit={handleTotalCommit}
            variant="total"
            allowNegative
          />
          {quantity > 1 && (
            <AmountField
              value={unitPrice}
              currencyCode={currencyCode}
              currencySymbol={currency.symbol}
              decimals={decimals}
              parse={parser}
              onCommit={handleUnitPriceCommit}
              variant="unit"
              allowNegative
              suffix={t("receipt.each")}
            />
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("receipt.remove_item")}
          className="hover:text-secondary rounded-full p-1 text-hint hover:bg-hint/10"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      <ParticipantChipGroup
        participantIds={participantIds}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
};

interface QuantityFieldProps {
  value: number;
  onChange: (v: number) => void;
}

const QuantityField = ({ value, onChange }: QuantityFieldProps) => {
  const { t } = useTranslation();
  const edit = useClickToEdit({
    format: () => String(value),
    commit: (draft) => {
      const parsed = parseInt(draft, 10);
      if (!isNaN(parsed) && parsed > 0) onChange(parsed);
    },
  });

  if (edit.editing) {
    return (
      <div className="flex items-center gap-1 text-xs text-hint">
        <span>{t("receipt.qty")}:</span>
        <input
          ref={edit.ref}
          type="number"
          min={1}
          inputMode="numeric"
          value={edit.draft}
          onChange={(e) => edit.setDraft(e.target.value)}
          onBlur={edit.finish}
          onKeyDown={edit.onKeyDown}
          className="w-12 border-b border-primary bg-transparent text-xs text-foreground outline-none"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={edit.start}
      className="hover:text-secondary flex w-fit items-center gap-1 text-xs text-hint"
    >
      <span>
        {t("receipt.qty")}: {value}
      </span>
    </button>
  );
};
