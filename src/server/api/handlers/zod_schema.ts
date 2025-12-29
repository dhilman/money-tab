import { z } from "zod";
import { CYCLE_UNITS } from "~/lib/consts/constants";
import { dayjsUTC } from "~/lib/dates/dates";

export const DateTimeStrAsDate = z
  .string()
  .transform((v) => z.coerce.date().parse(v));

export const DateOrDateTimeStrAsSql = z.string().transform((v) => {
  const date = z.coerce.date().parse(v);
  const iso = date.toISOString();
  if (v.length === 10) {
    return iso.slice(0, 10);
  }
  return iso.slice(0, 19).replace("T", " ");
});

export const DateStrAsDayJs = z.string().transform((v) => dayjsUTC(v));

export const Contribs = z.array(
  z.object({
    userId: z.string().nullable(),
    amountPaid: z.number().int(),
    amountOwed: z.number().int(),
    manualAmountOwed: z.boolean(),
  })
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
