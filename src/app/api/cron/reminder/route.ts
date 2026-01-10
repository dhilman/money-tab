import dayjs from "dayjs";
import type { NextRequest } from "next/server";
import type { AwaitedReturnType } from "~/@types/utils";
import { env } from "~/env.mjs";
import { addLeadTime } from "~/lib/dates/conversions";
import { isReminderDue } from "~/lib/dates/reminder";
import { calcNextReminderDate } from "~/lib/dates/subscription";
import { db, mutate, queries } from "~/server/db";
import { dayjsToSqlDateNullable } from "~/server/db/utils";
import logger from "~/server/logger";
import { queueClient } from "~/server/queue/client";
import { monitoredEdgeHandler } from "~/utils/handler_wrapper";
import { toMapGrouped } from "~/utils/map";

const log = logger.child({ module: "cron/reminder" });

export const dynamic = "force-dynamic";
export const POST = monitoredEdgeHandler(handler);

async function handler(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ success: false }), { status: 401 });
  }

  // Send subscription reminders & update reminder date
  await subsReminderCron();

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

type SubData = AwaitedReturnType<typeof queries.sub.remindCandidates>[number];

async function subsReminderCron() {
  // This retrieves candidates for remindering (all with reminderDate <= today)
  // Reminders are sent at or after 1pm
  // Check if the reminder is due based on the user's timezone
  const candidates = await queries.sub.remindCandidates();
  const subs = candidates.filter((sub) =>
    isReminderDue({ reminderDate: sub.reminderDate, timezone: sub.timezone }),
  );

  const subsByUser = toMapGrouped(subs, "userId");

  log.info(
    {
      candidates: candidates.length,
      subs: subs.length,
      users: subsByUser.size,
    },
    "sending reminders",
  );

  // Increase the message delay by 1sec for each user
  let delay = 0;
  for (const [, subscriptions] of subsByUser.entries()) {
    // Not checking tg id & isRegistered here, as it's already done in the query
    await notifyUser(subscriptions, delay);
    delay += 1;
  }
}

async function notifyUser(subs: SubData[], delay: number) {
  const [first, ...rest] = subs;
  if (!first) return;

  // Not checking tg id & isRegistered here, as it's already done in the query
  await queueClient.notification(
    {
      sendTo: {
        id: first.userId,
        telegramId: first.telegramId,
        languageCode: first.languageCode,
      },
      data: {
        type: "subs_reminder",
        subs: subs.map((sub) => ({
          ...sub,
          renewalDate: addLeadTime(dayjs(), sub.reminder).format("YYYY-MM-DD"),
        })),
      },
    },
    {
      delay,
    },
  );

  await db.batch([
    mutate.sub.updateReminder({
      contribId: first.contribId,
      reminderDate: calcNewReminderDate(first),
    }),
    ...rest.map((sub) =>
      mutate.sub.updateReminder({
        contribId: sub.contribId,
        reminderDate: calcNewReminderDate(sub),
      }),
    ),
  ]);
}

function calcNewReminderDate(sub: SubData) {
  return dayjsToSqlDateNullable(
    calcNextReminderDate({
      reminderDate: sub.reminderDate,
      cycle: { unit: sub.cycleUnit, value: sub.cycleValue },
      endDate: sub.endDate,
      leadTime: sub.reminder,
    }),
  );
}
