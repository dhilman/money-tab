/** All monetary amounts are in CENTS (integers) to avoid floating-point issues. */

export interface ReceiptItem {
  id: string;
  name: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
}

export interface ReceiptParse {
  sourceUrl: string;
  merchant?: string;
  date?: string;
  currencyCode?: string;
  total?: number;
  subtotal?: number;
  tax?: number;
  service?: number;
  tip?: number;
  discount?: number;
  items: ReceiptItem[];
  rawText?: string;
  confidence?: number;
}

export interface ItemAssignment {
  itemId: string;
  shares: Record<string, number>;
}

export type ExtrasAllocationMethod =
  | { type: "proportional_to_subtotal" }
  | { type: "even_among_involved" }
  | { type: "even_among_all" }
  | { type: "custom"; shares: Record<string, number> };

export interface ExtraCharge {
  id: "tax" | "service" | "tip" | "discount";
  label: string;
  amount: number;
  method: ExtrasAllocationMethod;
}

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
