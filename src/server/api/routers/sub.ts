import {
  subArchiveHandler,
  subCancelHandler,
} from "~/server/api/handlers/sub/sub-cancel";
import { subCreateHandler } from "~/server/api/handlers/sub/sub-create";
import { subGetHandler } from "~/server/api/handlers/sub/sub-get";
import { subJoinHandler } from "~/server/api/handlers/sub/sub-join";
import { subLeaveHandler } from "~/server/api/handlers/sub/sub-leave";
import { subUpdateHandler } from "~/server/api/handlers/sub/sub-update";
import { subUpdateReminderHandler } from "~/server/api/handlers/sub/sub-update-reminder";
import { subUpdateVisibilityHandler } from "~/server/api/handlers/sub/sub-update-visibility";
import { createTRPCRouter } from "~/server/api/trpc";

export const subRouter = createTRPCRouter({
  get: subGetHandler,
  join: subJoinHandler,
  create: subCreateHandler,
  update: subUpdateHandler,
  updateReminder: subUpdateReminderHandler,
  updateVisibility: subUpdateVisibilityHandler,
  cancel: subCancelHandler,
  archive: subArchiveHandler,
  leave: subLeaveHandler,
});
