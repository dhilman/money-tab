/**
 * Receipt parsing and split allocation types.
 * All monetary amounts are in CENTS (integers) to avoid floating-point precision issues.
 */

/** A single item from a parsed receipt */
export interface ReceiptItem {
  /** Unique ID for UI key binding */
  id: string;
  /** Item name/description */
  name: string;
  /** Quantity purchased (optional) */
  quantity?: number;
  /** Price per unit in cents (optional) */
  unitPrice?: number;
  /** Total price for this item in cents (required) */
  total: number;
}

/** Parsed receipt data from OCR */
export interface ReceiptParse {
  /** URL of the source image */
  sourceUrl: string;
  /** Merchant/store name */
  merchant?: string;
  /** Transaction date (ISO format YYYY-MM-DD) */
  date?: string;
  /** Currency code (e.g., "USD", "EUR", "GBP") */
  currencyCode?: string;
  /** Total amount in cents */
  total?: number;
  /** Subtotal before tax/tip in cents */
  subtotal?: number;
  /** Tax amount in cents */
  tax?: number;
  /** Service charge in cents */
  service?: number;
  /** Tip amount in cents */
  tip?: number;
  /** Discount amount in cents (positive value) */
  discount?: number;
  /** Line items from the receipt */
  items: ReceiptItem[];
  /** Raw OCR text (for debugging) */
  rawText?: string;
  /** OCR confidence score (0-1) */
  confidence?: number;
}

/** Assignment of participants to a receipt item */
export interface ItemAssignment {
  /** ID of the receipt item */
  itemId: string;
  /** Map of userId to share count (e.g., {"user1": 1, "user2": 2} means user2 pays 2x) */
  shares: Record<string, number>;
}

/** Method for allocating extra charges (tax, tip, service, discount) */
export type ExtrasAllocationMethod =
  | { type: "proportional_to_subtotal" }
  | { type: "even_among_involved" }
  | { type: "even_among_all" }
  | { type: "custom"; shares: Record<string, number> };

/** An extra charge or discount on the receipt */
export interface ExtraCharge {
  /** Charge type ID ("tax" | "service" | "tip" | "discount") */
  id: "tax" | "service" | "tip" | "discount";
  /** Display label */
  label: string;
  /** Amount in cents (negative for discount) */
  amount: number;
  /** How to allocate this charge among participants */
  method: ExtrasAllocationMethod;
}

/** State for receipt-based split */
export interface ReceiptSplitState {
  /** Whether receipt split is enabled */
  enabled: boolean;
  /** Item-to-participant assignments */
  assignments: ItemAssignment[];
  /** Extra charges configuration */
  extras: ExtraCharge[];
}

/** Per-person total breakdown */
export interface PersonTotal {
  /** User ID */
  userId: string;
  /** Sum of their item shares in cents */
  itemsSubtotal: number;
  /** Sum of their extra charges in cents */
  extrasTotal: number;
  /** Total amount owed in cents */
  total: number;
}
