import type { User as TgUser } from "grammy/types";

export const tgUserToUser = (u: TgUser) => ({
  telegramId: u.id,
  firstName: u.first_name,
  lastName: u.last_name,
  username: u.username,
  languageCode: u.language_code,
  tgIsPremium: u.is_premium,
});
