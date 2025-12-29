import { z } from "zod";
import { NotifyDataSchema } from "~/server/notifier/schema";

export const NotifyMessageSchema = z.object({
  sendTo: z.object({
    id: z.string(),
    telegramId: z.number(),
    languageCode: z.string().nullable(),
  }),
  data: NotifyDataSchema,
});
export type NotifyMessage = z.infer<typeof NotifyMessageSchema>;

export const AvatarMessageSchema = z.object({
  type: z.enum(["USER", "GROUP"]),
  id: z.string(),
  tgId: z.number(),
});
export type AvatarMessage = z.infer<typeof AvatarMessageSchema>;
