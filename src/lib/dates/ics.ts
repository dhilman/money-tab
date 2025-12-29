import dayjs from "dayjs";

interface IcsParams {
  title: string;
  start: string;
  end: string;
}

function createIcsData(params: IcsParams) {
  const startDate = dayjs(params.start).format("YYYYMMDDTHHmmss[Z]");
  console.log("startDate", startDate);
  const endDate = dayjs(params.end).format("YYYYMMDDTHHmmss[Z]");
  const id = Math.random().toString(36).substring(7);

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Example Corp.//CalDAV Client//EN
BEGIN:VEVENT
UID:${id}
DTSTAMP:${startDate}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${params.title}
END:VEVENT
END:VCALENDAR`;
}

export function createIcsDataUrl(params: IcsParams) {
  const data = createIcsData(params);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(data)}`;
}

export function formatEventDate(date: string) {
  return dayjs(date, { utc: true }).format("ddd, MMMM D, HH:mm");
}

export function getGoogleCalendarLink(params: IcsParams) {
  const start = dayjs(params.start, { utc: true }).format("YYYYMMDDTHHmmss");
  const end = dayjs(params.end, { utc: true }).format("YYYYMMDDTHHmmss");
  console.log("start", {
    start: params.start,
    formatted: start,
    end: params.end,
    formattedEnd: end,
  });
  const title = encodeURIComponent(params.title);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}`;
}

export function getOutlookCalendarLink(params: IcsParams) {
  const start = dayjs(params.start, { utc: true }).format(
    "YYYY-MM-DDTHH:mm:ss"
  );
  const end = dayjs(params.end, { utc: true }).format("YYYY-MM-DDTHH:mm:ss");
  const title = encodeURIComponent(params.title);
  return `https://outlook.live.com/owa/?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${start}&enddt=${end}`;
}
