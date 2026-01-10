import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import i18n from "~/lib/i18n";

dayjs.extend(relativeTime);

interface FormatDateRelativeOptions {
  utc?: boolean;
}

export const formatDateRelative = (
  date: Date | string,
  params: FormatDateRelativeOptions = {},
) => {
  const { utc = true } = params;
  const d = dayjs(date, { utc });
  const today = dayjs().startOf("day");
  const diff = d.diff(today, "day");

  if (diff === 0) {
    return i18n.t("today");
  }
  if (diff === 1) {
    return i18n.t("tomorrow");
  }
  if (diff === -1) {
    return i18n.t("yesterday");
  }
  return d.from(today);
};

export const formatDateTimeRelative = (date: Date | string) => {
  const d = dayjs(date, { utc: true });
  return d.fromNow();
};
