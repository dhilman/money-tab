"use client";

import { AlertCircleIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { useCurrencyAmountParser } from "~/components/form/amount-utils";
import { useCurrencies } from "~/lib/amount/currencies";
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

  const handleAdd = () => {
    const id = addItem();
    setPendingFocusId(id);
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
            onUpdate={(patch) => updateItem(item.id, patch)}
            onRemove={() => removeItem(item.id)}
            autoFocus={pendingFocusId === item.id}
            onAutoFocused={() => setPendingFocusId(null)}
          />
        ))}
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

  const quantity = item.quantity ?? 1;
  // Unit price is purely derived from `total / quantity` for display; only the
  // total is the authoritative stored value. Editing either preserves the
  // invariant `total = quantity * unitPrice`.
  const unitPrice =
    quantity > 1
      ? (item.unitPrice ?? Math.round(item.total / quantity))
      : item.total;

  const handleTotalCommit = (v: number) => {
    onUpdate(
      quantity > 1
        ? { total: v, unitPrice: Math.round(v / quantity) }
        : { total: v, unitPrice: v },
    );
  };

  const handleUnitPriceCommit = (v: number) => {
    onUpdate({ unitPrice: v, total: v * quantity });
  };

  const handleQuantityChange = (q: number) => {
    onUpdate({ quantity: q, unitPrice: Math.round(item.total / Math.max(q, 1)) });
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-hint/10 bg-background p-3",
        "touch-manipulation",
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
              value={item.name}
              placeholder={t("receipt.item_name")}
              onChange={(e) => onUpdate({ name: e.target.value })}
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
              suffix={t("receipt.each")}
            />
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("receipt.remove_item")}
          className="rounded-full p-1 text-hint hover:bg-hint/10 hover:text-secondary"
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const start = () => {
    setDraft(String(value));
    setEditing(true);
  };

  const commit = () => {
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 text-xs text-hint">
        <span>{t("receipt.qty")}:</span>
        <input
          ref={ref}
          type="number"
          min={1}
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            else if (e.key === "Escape") setEditing(false);
          }}
          className="w-12 border-b border-primary bg-transparent text-xs text-foreground outline-none"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className="flex w-fit items-center gap-1 text-xs text-hint hover:text-secondary"
    >
      <span>
        {t("receipt.qty")}: {value}
      </span>
    </button>
  );
};

type AmountVariant = "total" | "unit";

interface AmountFieldProps {
  value: number;
  currencyCode: string;
  currencySymbol: string;
  decimals: number;
  parse: (s: string) => number | null;
  onCommit: (v: number) => void;
  variant?: AmountVariant;
  /** Optional suffix shown after the formatted value (e.g. "each"). */
  suffix?: string;
}

const AMOUNT_STYLES: Record<AmountVariant, { text: string; input: string }> = {
  total: {
    text: "text-sm font-medium text-primary hover:underline",
    input: "w-20 text-sm font-medium text-primary",
  },
  unit: {
    text: "text-xs text-hint hover:text-secondary",
    input: "w-16 text-xs text-hint",
  },
};

const AmountField = ({
  value,
  currencyCode,
  currencySymbol,
  decimals,
  parse,
  onCommit,
  variant = "total",
  suffix,
}: AmountFieldProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const styles = AMOUNT_STYLES[variant];

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const start = () => {
    setDraft((value / 10 ** decimals).toFixed(decimals));
    setEditing(true);
  };

  const commit = () => {
    const parsed = parse(draft);
    if (parsed !== null && parsed >= 0) {
      onCommit(parsed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex shrink-0 items-center gap-0.5">
        <span className="text-hint">{currencySymbol}</span>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            else if (e.key === "Escape") setEditing(false);
          }}
          className={cn(
            "border-b border-primary bg-transparent text-right outline-none",
            styles.input,
          )}
        />
        {suffix && <span className="ml-1 text-hint">{suffix}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className={cn("shrink-0", styles.text)}
    >
      {formatAmountCurrency(value, currencyCode)}
      {suffix && <span className="ml-1">{suffix}</span>}
    </button>
  );
};
