/** All monetary amounts are in CENTS (integers) to avoid floating-point issues. */

import type { z } from "zod";
import type {
  ExtraChargeSchema,
  ExtrasAllocationMethodSchema,
  ItemAssignmentSchema,
  ReceiptDataSchema,
  ReceiptItemSchema,
  ReceiptParseSchema,
  ReceiptSplitModeSchema,
} from "./schema";

export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;

export type ReceiptParse = z.infer<typeof ReceiptParseSchema>;

export type ItemAssignment = z.infer<typeof ItemAssignmentSchema>;

export type ExtrasAllocationMethod = z.infer<
  typeof ExtrasAllocationMethodSchema
>;

export type ExtraCharge = z.infer<typeof ExtraChargeSchema>;

export type ReceiptSplitMode = z.infer<typeof ReceiptSplitModeSchema>;

/**
 * Persisted itemized receipt data for a transaction.
 * Stored in transactions.receipt_data jsonb column. `splitMode` records the
 * split mode chosen by the user; older rows omit it (presence then implies itemized).
 */
export type ReceiptData = z.infer<typeof ReceiptDataSchema>;

export interface ReceiptSplitState {
  enabled: boolean;
  assignments: ItemAssignment[];
  extras: ExtraCharge[];
}

export interface PersonTotal {
  userId: string;
  itemsSubtotal: number;
  extrasTotal: number;
  total: number;
}
