import { z } from "zod";
import { CYCLE_UNITS } from "~/lib/consts/constants";
import { dayjsUTC } from "~/lib/dates/dates";

export const DateTimeStrAsDate = z
  .string()
  .transform((v) => z.coerce.date().parse(v));

export const DateOrDateTimeStr = z.string().transform((v) => {
  const d = z.coerce.date().parse(v);
  if (v.length === 10) {
    return { date: d, time: null as string | null };
  }
  // Extract time from the UTC-normalized Date to handle timezone offsets
  const timePart = d.toISOString().slice(11, 19);
  return { date: d, time: timePart };
});

export const DateStrAsDayJs = z.string().transform((v) => dayjsUTC(v));

export const Contribs = z.array(
  z.object({
    userId: z.string().nullable(),
    amountPaid: z.number().int(),
    amountOwed: z.number().int(),
    manualAmountOwed: z.boolean(),
  }),
);

export const Cycle = z.object({
  unit: z.enum(CYCLE_UNITS),
  value: z.number().int().positive(),
});

export const File = z.object({
  id: z.string(),
  url: z.string(),
  size: z.number(),
  type: z.string(),
});

export const Files = z.array(File);

const ReceiptItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().optional(),
  unitPrice: z.number().int().optional(),
  total: z.number().int(),
});

const ReceiptParseSchema = z.object({
  sourceUrl: z.string(),
  merchant: z.string().optional(),
  date: z.string().optional(),
  currencyCode: z.string().optional(),
  total: z.number().int().optional(),
  subtotal: z.number().int().optional(),
  tax: z.number().int().optional(),
  service: z.number().int().optional(),
  tip: z.number().int().optional(),
  discount: z.number().int().optional(),
  items: z.array(ReceiptItemSchema),
  rawText: z.string().optional(),
  confidence: z.number().optional(),
});

const ItemAssignmentSchema = z.object({
  itemId: z.string(),
  shares: z.record(z.string(), z.number()),
});

const ExtrasAllocationMethodSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("proportional_to_subtotal") }),
  z.object({ type: z.literal("even_among_involved") }),
  z.object({ type: z.literal("even_among_all") }),
  z.object({
    type: z.literal("custom"),
    shares: z.record(z.string(), z.number()),
  }),
]);

const ExtraChargeSchema = z.object({
  id: z.enum(["tax", "service", "tip", "discount"]),
  label: z.string(),
  amount: z.number().int(),
  method: ExtrasAllocationMethodSchema,
});

export const ReceiptDataSchema = z.object({
  receipt: ReceiptParseSchema,
  assignments: z.array(ItemAssignmentSchema),
  extras: z.array(ExtraChargeSchema),
});
