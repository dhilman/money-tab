import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "~/env.mjs";
import logger from "~/server/logger";
import { tg_hmac } from "~/server/signing";

const InitDataSchema = z.object({
  chat_instance: z.bigint().optional(),
  chat_type: z
    .enum(["sender", "private", "group", "supergroup", "channel"])
    .optional(),
  user: z.object({
    id: z.number(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    username: z.string().optional(),
    photo_url: z.string().optional(),
    allows_write_to_pm: z.boolean().optional(),
    language_code: z.string().optional(),
  }),
  auth_date: z.bigint(),
});

export async function validateAndParseInitData(
  data: string,
): Promise<z.infer<typeof InitDataSchema>> {
  const { hash, checkString, values } = checkStringFromInitData(data);

  const hmac = await tg_hmac({
    key: env.BOT_TOKEN,
    salt: "WebAppData",
    data: checkString,
  });

  if (hmac !== hash) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }

  logger.info({ values }, "Validated initData");

  const structured = {
    chat_instance: values?.chat_instance
      ? BigInt(values.chat_instance)
      : undefined,
    chat_type: values?.chat_type,
    user: JSON.parse(values?.user ?? "{}") as unknown,
    auth_date: values?.auth_date ? BigInt(values.auth_date) : undefined,
  };

  const res = InitDataSchema.safeParse(structured);
  if (!res.success) {
    logger.error(
      {
        error: res.error,
        init_data: data,
        structured: structured,
      },
      "Invalid init data format",
    );
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Bad Request",
    });
  }
  return res.data;
}

function checkStringFromInitData(data: string) {
  const values = Object.fromEntries(new URLSearchParams(data));

  const hash = values.hash as string;

  const checkString = Object.keys(values)
    .filter((key) => key !== "hash")
    .sort()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .map((key) => `${key}=${values[key]!}`)
    .join("\n");

  return { hash, checkString, values };
}
