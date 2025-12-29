import { z } from "zod";
import { type MyContext, privateProcedure } from "~/server/api/trpc";

const input = z.object({});
type Input = z.infer<typeof input>;

export const handler = privateProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    await validate(ctx, input);
    return {};
  });

const validate = async (ctx: MyContext, input: Input) => {
  return Promise.resolve({ ctx, input });
};
