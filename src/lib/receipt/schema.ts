import { z } from "zod";

/**
 * Zod schemas for receiptData. Lives under `src/lib/receipt` so both server
 * code (input validation) and client code (defensive `safeParse` on hydration
 * from the API) can share a single source of truth.
 *
 * Monetary fields are integer cents — see `src/lib/receipt/types.ts`.
 */

const ReceiptItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().int().optional(),
  total: z.number().int().nonnegative(),
});

const ReceiptParseSchema = z.object({
  sourceUrl: z.string(),
  merchant: z.string().optional(),
  date: z.string().optional(),
  currencyCode: z.string().optional(),
  total: z.number().int().nonnegative().optional(),
  subtotal: z.number().int().nonnegative().optional(),
  tax: z.number().int().nonnegative().optional(),
  service: z.number().int().nonnegative().optional(),
  tip: z.number().int().nonnegative().optional(),
  // Stored as a positive amount on the receipt; negated when applied as an extra.
  discount: z.number().int().nonnegative().optional(),
  items: z.array(ReceiptItemSchema),
  rawText: z.string().optional(),
  confidence: z.number().optional(),
});

const ItemAssignmentSchema = z.object({
  itemId: z.string(),
  shares: z.record(z.string(), z.number().int().nonnegative()),
});

const ExtrasAllocationMethodSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("proportional_to_subtotal") }),
  z.object({ type: z.literal("even_among_involved") }),
  z.object({ type: z.literal("even_among_all") }),
  z.object({
    type: z.literal("custom"),
    shares: z.record(z.string(), z.number().int().nonnegative()),
  }),
]);

const ExtraChargeSchema = z.object({
  id: z.enum(["tax", "service", "tip", "discount"]),
  label: z.string(),
  // Discounts are stored as negative; everything else is non-negative.
  amount: z.number().int(),
  method: ExtrasAllocationMethodSchema,
});

export const ReceiptDataSchema = z.object({
  receipt: ReceiptParseSchema,
  assignments: z.array(ItemAssignmentSchema),
  extras: z.array(ExtraChargeSchema),
});
