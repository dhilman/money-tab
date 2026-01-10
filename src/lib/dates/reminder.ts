import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { dayjsUTC } from "~/lib/dates/dates";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Checks if the reminder date is due based on the user's timezone.
 * To be due the reminder date must be after 1pm in the user's timezone.
 * Reminder date format is YYYY-MM-DD.
 */
export const isReminderDue = (params: {
  reminderDate: string;
  timezone: string;
}) => {
  const now = dayjsUTC();

  const reminderDateTime = dayjs.tz(
    `${params.reminderDate} 12:59`,
    params.timezone,
  );

  return now.isAfter(reminderDateTime);
};
