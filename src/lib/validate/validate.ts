import dayjs from "dayjs";
import toast from "react-hot-toast";
import type { Attachment } from "~/components/form/file-input";
import type { Cycle, ReminderValue } from "~/lib/consts/types";
import { addCycles, addLeadTime } from "~/lib/dates/conversions";
import i18n from "~/lib/i18n";

export function validAmount(amount: number) {
  if (amount <= 0) {
    toast.error(i18n.t("error.enter_positive_amount"));
    return false;
  }
  if (!Number.isSafeInteger(amount)) {
    toast.error(i18n.t("error.number_too_large"));
    return false;
  }
  return true;
}

interface Split {
  userId: string | null;
  amountPaid: number;
  amountOwed: number;
}

export function validIsInSplit(splits: Split[], userId: string) {
  if (
    !splits.some(
      (s) => s.userId === userId && (s.amountPaid > 0 || s.amountOwed > 0),
    )
  ) {
    toast.error(i18n.t("error.you_must_be_involved"));
    return false;
  }
  return true;
}

export function validSplitsAmounts(splits: Split[], amount: number) {
  const totalOwed = splits.reduce((acc, s) => acc + s.amountOwed, 0);
  if (amount < totalOwed) {
    toast.error(i18n.t("error.total_owed_exceeds_amount"));
    return false;
  }
  return true;
}

export function validContribs(
  callerId: string,
  total: number,
  contribs: Split[],
) {
  if (!validIsInSplit(contribs, callerId)) return false;
  if (!validSplitsAmounts(contribs, total)) return false;
  return true;
}

export function validReminder(params: {
  cycle: Cycle;
  reminder: ReminderValue | null;
}) {
  if (!params.reminder) return true;

  const now = dayjs();
  const afterCycle = addCycles(now, params.cycle, 1);
  const reminderDate = addLeadTime(now, params.reminder);

  if (reminderDate.isAfter(afterCycle)) {
    toast.error(i18n.t("error.reminder_exceeds_freq"));
    return false;
  }
  return true;
}

export function validEndDate(params: {
  startDate: string;
  endDate: string | null;
}) {
  if (
    params.endDate &&
    dayjs(params.endDate).isBefore(params.startDate, "day")
  ) {
    toast.error(i18n.t("error.end_after_start_date"));
    return false;
  }
  return true;
}

export function validFiles(files: Attachment[]) {
  if (files.some((v) => v.uploading)) {
    toast.error(i18n.t("error.file_uploading"));
    return false;
  }
  return true;
}
