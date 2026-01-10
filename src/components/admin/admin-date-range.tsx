import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { NativeSelect } from "~/components/form/native-select";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

const OPTIONS = [
  { value: "30min", label: "Last 30 minutes" },
  { value: "1h", label: "Last 1 hour" },
  { value: "12h", label: "Last 12 hours" },
  { value: "1d", label: "Today" },
  { value: "1w", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
] as const;

type DateRangePeriod = (typeof OPTIONS)[number]["value"];

const TODAY = dayjs();
const TMR_ISO = dayjs().add(1, "day").toISOString();

function optionToDateIso(option: DateRangePeriod) {
  const date = TODAY;
  switch (option) {
    case "30min":
      return date.subtract(30, "minute").toISOString();
    case "1h":
      return date.subtract(1, "hour").toISOString();
    case "12h":
      return date.subtract(12, "hour").toISOString();
    case "1d":
      return date.startOf("day").toISOString();
    case "1w":
      return date.subtract(7, "day").toISOString();
    case "30d":
      return date.subtract(30, "day").toISOString();
    case "all":
      return date.subtract(5, "year").toISOString();
    default:
      return "";
  }
}

export const useDateRangeQuery = () => {
  const router = useRouter();
  const period = (router.query.period as DateRangePeriod) ?? "1d";
  const startDate =
    (router.query.startDate as string) ??
    optionToDateIso(period) ??
    optionToDateIso("1d");
  const endDate = (router.query.endDate as string) ?? TMR_ISO;
  return {
    value: { period, startDate, endDate },
    onChange: (value: DateRange) => {
      void router.replace({
        query: {
          ...router.query,
          period: value.period,
          startDate: value.startDate,
          endDate: value.endDate,
        },
      });
    },
  };
};

interface DateRange {
  period: DateRangePeriod;
  startDate: string;
  endDate: string;
}

interface Props {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export const AdminDateRange = ({ value, onChange }: Props) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    setStartDate(dayjs(value.startDate).format("YYYY-MM-DD"));
    setEndDate(dayjs(value.endDate).format("YYYY-MM-DD"));
  }, [value]);

  const getButtonLabel = () => {
    if (value.period !== "custom") {
      return OPTIONS.find((o) => o.value === value.period)?.label;
    }
    return (
      dayjs(value.startDate).format("MMM D") +
      " - " +
      dayjs(value.endDate).format("MMM D")
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="h-9 w-40 justify-start text-left font-semibold"
        >
          {getButtonLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="flex w-auto flex-col space-y-2 p-2"
        align="end"
      >
        <NativeSelect
          className="w-full"
          options={OPTIONS}
          value={value.period}
          onChange={(v) => {
            if (v === "custom") {
              return;
            }
            onChange({
              period: v,
              startDate: optionToDateIso(v),
              endDate: new Date().toISOString(),
            });
          }}
        />
        <div className="border-hint/10 rounded-md border">
          <Calendar
            initialFocus
            mode="range"
            selected={{ from: new Date(startDate), to: new Date(endDate) }}
            onSelect={(range) => {
              setStartDate(dayjs(range?.from).format("YYYY-MM-DD"));
              range?.to && setEndDate(dayjs(range.to).format("YYYY-MM-DD"));
            }}
          />
        </div>
        <Button
          className="w-full"
          variant="secondary"
          size="sm"
          disabled={!startDate}
          onClick={() => {
            onChange({
              period: "custom",
              startDate: dayjs(startDate).toISOString(),
              endDate: endDate
                ? dayjs(endDate).toISOString()
                : dayjs().toISOString(),
            });
          }}
        >
          Submit
        </Button>
      </PopoverContent>
    </Popover>
  );
};
