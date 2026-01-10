import dayjs from "dayjs";

interface FormatDateOpts {
  utc?: boolean;
}

export const formatDateTime = (date: Date | string) => {
  const d = dayjs(date, { utc: true });
  return d.format("D MMM YYYY HH:mm");
};

export const formatDate = (
  date: Date | string | dayjs.Dayjs,
  opts: FormatDateOpts = {},
) => {
  const { utc = true } = opts;
  const d = dayjs(date, { utc }).startOf("day");
  return d.format("D MMM YYYY");
};

export const getDateLocal = (date: Date) => {
  return dayjs(date).format("YYYY-MM-DD");
};

export const getDateAndTimeLocalFromUTC = (d: string) => {
  const js = dayjs(d, { utc: true });
  return { date: js.format("YYYY-MM-DD"), time: js.format("HH:mm") };
};

export const getDateTimeLocalFromUTC = (d: string) => {
  return dayjs(d, { utc: true }).format("YYYY-MM-DDTHH:mm");
};
