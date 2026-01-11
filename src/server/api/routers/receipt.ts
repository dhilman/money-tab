import { createTRPCRouter } from "~/server/api/trpc";
import { receiptParseHandler } from "~/server/api/handlers/receipt/receipt-parse";

export const receiptRouter = createTRPCRouter({
  parse: receiptParseHandler,
});
