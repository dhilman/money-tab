import dayjs from "dayjs";
import { BellIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SubFrequency } from "~/components/pages/sub/sub-freq";
import { useProfile } from "~/components/provider/auth/auth-provider";
import type { CycleUnit } from "~/lib/consts/types";
import { isBeforeOrEqualToToday } from "~/lib/dates/dates";
import { formatDateRelative } from "~/lib/dates/format-date-relative";
import { formatDate } from "~/lib/dates/format-dates";
import { cn } from "~/lib/utils";
import type { RouterOutputs } from "~/utils/api";

type Sub = RouterOutputs["user"]["start"]["subscriptions"][number];

interface SubNextDateProps {
  sub: Sub;
  absolute?: boolean;
}

export const SubNextDate = ({ sub, absolute }: SubNextDateProps) => {
  const { user } = useProfile();
  const { t } = useTranslation();
  const contrib = sub.contribs.find((c) => c.userId === user.id);
  const isRenewingSoon = useMemo(() => {
    if (!sub.renewalDate) return false;
    const renewalDate = dayjs(sub.renewalDate);
    const diff = renewalDate.diff(dayjs(), "day");
    return diff <= 3;
  }, [sub.renewalDate]);

  function formatDateFunc(d: string) {
    if (absolute) return formatDate(d, { utc: false });
    return formatDateRelative(d, { utc: false });
  }

  if (sub.renewalDate) {
    return (
      <div
        className={cn(
          "text-hint inline-flex items-center text-sm",
          isRenewingSoon && "text-primary",
        )}
      >
        {contrib?.reminderDate && (
          <BellIcon className="fill-primary text-primary mr-1 h-4 w-4 stroke-[2.5px] p-[3px]" />
        )}
        {formatDateFunc(sub.renewalDate)}
      </div>
    );
  }

  if (sub.endDate) {
    const ended = isBeforeOrEqualToToday(sub.endDate);
    return (
      <div className="text-hint inline-flex items-center text-sm">
        {contrib?.reminderDate && (
          <BellIcon className="fill-primary text-primary mr-1 h-4 w-4 stroke-[2.5px] p-[3px]" />
        )}
        {ended ? t("ended") : t("ends")}{" "}
        {formatDate(sub.endDate, { utc: false })}
      </div>
    );
  }

  return null;
};

interface SubFreqBadgeProps {
  unit: CycleUnit;
  value: number;
}

export const SubFreqBadge = ({ unit, value }: SubFreqBadgeProps) => {
  return (
    <div className="bg-hint/10 text-hint inline-flex items-center justify-center gap-1 rounded-sm px-2.5">
      <div className="text-xs font-medium">
        <SubFrequency unit={unit} value={value} />
      </div>
    </div>
  );
};
