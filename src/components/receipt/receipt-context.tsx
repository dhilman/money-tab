"use client";

import { createId } from "@paralleldrive/cuid2";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  computePersonTotals,
  getUnassignedItems,
  validateTotals,
} from "~/lib/receipt";
import type {
  ExtraCharge,
  ItemAssignment,
  PersonTotal,
  ReceiptData,
  ReceiptItem,
  ReceiptParse,
} from "~/lib/receipt";
import type { Attachment } from "~/components/form/file-input";

// ============================================================================
// Types
// ============================================================================

interface ReceiptState {
  /** The parsed receipt from OCR, or null if no receipt scanned */
  receipt: ReceiptParse | null;
  /** The receipt image file metadata for attachment */
  receiptFile: Attachment | null;
  /** Item-to-participant assignments */
  assignments: ItemAssignment[];
  /** Extra charges (tax, tip, etc.) with allocation methods */
  extras: ExtraCharge[];
  /** Whether itemized split mode is enabled */
  splitEnabled: boolean;
}

interface ReceiptContextValue extends ReceiptState {
  /** Set the parsed receipt from OCR with file metadata */
  setReceipt: (receipt: ReceiptParse | null, file?: Attachment | null) => void;
  /** Clear the receipt and all assignments */
  clearReceipt: () => void;

  /** Toggle a participant's assignment to an item */
  toggleItemAssignment: (itemId: string, userId: string) => void;
  /** Set custom share count for a participant on an item */
  setItemShare: (itemId: string, userId: string, shares: number) => void;

  /** Patch a receipt item (name, quantity, unit price, total). */
  updateItem: (itemId: string, patch: Partial<Omit<ReceiptItem, "id">>) => void;
  /** Append a blank item to the receipt. Returns the new item id. */
  addItem: () => string;
  /** Remove an item and any assignments referencing it. */
  removeItem: (itemId: string) => void;

  /** Update an extra charge's allocation method */
  setExtraMethod: (extraId: string, method: ExtraCharge["method"]) => void;
  /** Update an extra charge's amount (allows editing or removing) */
  setExtraAmount: (extraId: string, amount: number) => void;
  /** Remove an extra charge entirely */
  removeExtra: (extraId: string) => void;

  /** Enable/disable itemized split mode */
  setSplitEnabled: (enabled: boolean) => void;

  // Computed values
  /** Computed per-person totals */
  personTotals: PersonTotal[];
  /** Items with no participants assigned */
  unassignedItems: ReceiptItem[];
  /** Difference between person totals sum and receipt total (0 = exact match) */
  totalsDifference: number;
  /** Whether all items are assigned and totals match (informational only) */
  isValid: boolean;
}

// ============================================================================
// Context
// ============================================================================

const ReceiptContext = createContext<ReceiptContextValue | null>(null);

export function useReceiptCtx() {
  const ctx = useContext(ReceiptContext);
  if (!ctx) {
    throw new Error("useReceiptCtx must be used within ReceiptProvider");
  }
  return ctx;
}

/** Optional hook that returns null if not in receipt context (for conditional usage) */
export function useReceiptCtxOptional() {
  return useContext(ReceiptContext);
}

// ============================================================================
// Provider
// ============================================================================

interface ReceiptProviderProps {
  /** All participant user IDs in the transaction */
  participantIds: string[];
  /** Pre-existing receipt data (for the edit flow). Hydrates state on first render. */
  initialData?: ReceiptData | null;
  children: React.ReactNode;
}

export function ReceiptProvider({
  participantIds,
  initialData,
  children,
}: ReceiptProviderProps) {
  const [receipt, setReceiptState] = useState<ReceiptParse | null>(
    initialData?.receipt ?? null,
  );
  const [receiptFile, setReceiptFile] = useState<Attachment | null>(null);
  const [assignments, setAssignments] = useState<ItemAssignment[]>(
    initialData?.assignments ?? [],
  );
  const [extras, setExtras] = useState<ExtraCharge[]>(
    initialData?.extras ?? [],
  );
  const [splitEnabled, setSplitEnabled] = useState(!!initialData);

  // Initialize extras from receipt
  const setReceipt = useCallback(
    (newReceipt: ReceiptParse | null, file?: Attachment | null) => {
      setReceiptState(newReceipt);
      setReceiptFile(file ?? null);
      setAssignments([]);
      setSplitEnabled(false);

      if (newReceipt) {
        // Initialize extras from receipt
        const newExtras: ExtraCharge[] = [];
        if (newReceipt.tax) {
          newExtras.push({
            id: "tax",
            label: "Tax",
            amount: newReceipt.tax,
            method: { type: "proportional_to_subtotal" },
          });
        }
        if (newReceipt.tip) {
          newExtras.push({
            id: "tip",
            label: "Tip",
            amount: newReceipt.tip,
            method: { type: "even_among_involved" },
          });
        }
        if (newReceipt.service) {
          newExtras.push({
            id: "service",
            label: "Service",
            amount: newReceipt.service,
            method: { type: "proportional_to_subtotal" },
          });
        }
        if (newReceipt.discount) {
          newExtras.push({
            id: "discount",
            label: "Discount",
            amount: -newReceipt.discount, // Negative for discount
            method: { type: "proportional_to_subtotal" },
          });
        }
        setExtras(newExtras);
      } else {
        setExtras([]);
      }
    },
    []
  );

  const clearReceipt = useCallback(() => {
    setReceiptState(null);
    setReceiptFile(null);
    setAssignments([]);
    setExtras([]);
    setSplitEnabled(false);
  }, []);

  const toggleItemAssignment = useCallback((itemId: string, userId: string) => {
    setAssignments((prev) => {
      const existing = prev.find((a) => a.itemId === itemId);
      if (!existing) {
        // Create new assignment with this user
        return [...prev, { itemId, shares: { [userId]: 1 } }];
      }

      const currentShare = existing.shares[userId] ?? 0;
      const newShares = { ...existing.shares };

      if (currentShare > 0) {
        // Remove user
        delete newShares[userId];
      } else {
        // Add user with 1 share
        newShares[userId] = 1;
      }

      return prev.map((a) =>
        a.itemId === itemId ? { ...a, shares: newShares } : a
      );
    });
  }, []);

  const setItemShare = useCallback(
    (itemId: string, userId: string, shares: number) => {
      setAssignments((prev) => {
        const existing = prev.find((a) => a.itemId === itemId);
        if (!existing) {
          if (shares <= 0) return prev;
          return [...prev, { itemId, shares: { [userId]: shares } }];
        }

        const newShares = { ...existing.shares };
        if (shares <= 0) {
          delete newShares[userId];
        } else {
          newShares[userId] = shares;
        }

        return prev.map((a) =>
          a.itemId === itemId ? { ...a, shares: newShares } : a
        );
      });
    },
    []
  );

  const updateItem = useCallback(
    (itemId: string, patch: Partial<Omit<ReceiptItem, "id">>) => {
      setReceiptState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, ...patch } : item,
          ),
        };
      });
    },
    [],
  );

  const addItem = useCallback(() => {
    const id = createId();
    setReceiptState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: [...prev.items, { id, name: "", total: 0 }],
      };
    });
    return id;
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setReceiptState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      };
    });
    setAssignments((prev) => prev.filter((a) => a.itemId !== itemId));
  }, []);

  const setExtraMethod = useCallback(
    (extraId: string, method: ExtraCharge["method"]) => {
      setExtras((prev) =>
        prev.map((e) => (e.id === extraId ? { ...e, method } : e))
      );
    },
    []
  );

  const setExtraAmount = useCallback(
    (extraId: string, amount: number) => {
      setExtras((prev) =>
        prev.map((e) => (e.id === extraId ? { ...e, amount } : e))
      );
    },
    []
  );

  const removeExtra = useCallback((extraId: string) => {
    setExtras((prev) => prev.filter((e) => e.id !== extraId));
  }, []);

  const items = useMemo(() => receipt?.items ?? [], [receipt?.items]);

  const personTotals = useMemo(() => {
    if (!splitEnabled || items.length === 0) return [];
    return computePersonTotals(items, assignments, extras, participantIds);
  }, [items, assignments, extras, participantIds, splitEnabled]);

  const unassignedItems = useMemo(() => {
    if (!splitEnabled) return [];
    return getUnassignedItems(items, assignments, participantIds);
  }, [items, assignments, participantIds, splitEnabled]);

  const totalsDifference = useMemo(() => {
    if (!splitEnabled || !receipt?.total) return 0;
    return validateTotals(personTotals, receipt.total);
  }, [personTotals, receipt?.total, splitEnabled]);

  const isValid =
    !splitEnabled || (unassignedItems.length === 0 && totalsDifference === 0);

  const value = useMemo<ReceiptContextValue>(
    () => ({
      receipt,
      receiptFile,
      assignments,
      extras,
      splitEnabled,
      setReceipt,
      clearReceipt,
      toggleItemAssignment,
      setItemShare,
      updateItem,
      addItem,
      removeItem,
      setExtraMethod,
      setExtraAmount,
      removeExtra,
      setSplitEnabled,
      personTotals,
      unassignedItems,
      totalsDifference,
      isValid,
    }),
    [
      receipt,
      receiptFile,
      assignments,
      extras,
      splitEnabled,
      setReceipt,
      clearReceipt,
      toggleItemAssignment,
      setItemShare,
      updateItem,
      addItem,
      removeItem,
      setExtraMethod,
      setExtraAmount,
      removeExtra,
      personTotals,
      unassignedItems,
      totalsDifference,
      isValid,
    ]
  );

  return (
    <ReceiptContext.Provider value={value}>{children}</ReceiptContext.Provider>
  );
}
