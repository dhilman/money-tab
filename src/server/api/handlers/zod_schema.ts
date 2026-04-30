import { z } from "zod";
import { CYCLE_UNITS } from "~/lib/consts/constants";
import { dayjsUTC } from "~/lib/dates/dates";

export { ReceiptDataSchema } from "~/lib/receipt/schema";

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

