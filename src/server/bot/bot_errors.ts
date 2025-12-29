import { GrammyError } from "grammy";

export function isKickedFromGroupError(err: unknown) {
  if (!(err instanceof GrammyError)) return false;
  if (err.message.includes("not enough rights")) return true;
  if (err.message.includes("bot was kicked")) return true;
  return false;
}

export function isDeactivatedError(err: unknown) {
  if (!(err instanceof GrammyError)) return false;
  if (err.message.includes("bot was blocked by the user")) return true;
  if (err.message.includes("user is deactivated")) return true;
  return false;
}
