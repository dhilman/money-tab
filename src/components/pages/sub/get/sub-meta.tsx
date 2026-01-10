import { CalendarIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
import { ReminderInput } from "~/components/form/reminder-select";
import { useSubCtx } from "~/components/pages/sub/get/sub-provider";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { LoadingProvider } from "~/components/provider/states-provider";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemIcon,
  ListItemLeft,
  ListItemLoading,
} from "~/components/ui/list-item";
import { formatDateRelative } from "~/lib/dates/format-date-relative";
import { formatDate } from "~/lib/dates/format-dates";

export const SubMeta = () => {
  const { isLoading } = useSubCtx();

  return (
    <Bento>
      <LoadingProvider
        isLoading={isLoading}
        loading={
          <List>
            <ListItemLoading />
          </List>
        }
      >
        <SubDateAndReminder />
      </LoadingProvider>
    </Bento>
  );
};

const SubDateAndReminder = () => {
  const { t } = useTranslation();
  const { sub, hasEnded } = useSubCtx();
  const date = useMemo(() => {
    if (sub.archivedAt) return null;
    if (sub.renewalDate) {
      const isStart = sub.renewalDate === sub.startDate;
      return {
        type: "renewal",
        label: isStart ? t("starts") : t("next_payment"),
        relative: formatDateRelative(sub.renewalDate, { utc: false }),
        date: formatDate(sub.renewalDate, { utc: false }),
      };
    }
    if (sub.endDate) {
      return {
        type: "end",
        label: hasEnded ? t("ended") : t("ends"),
        date: formatDate(sub.endDate, { utc: false }),
      };
    }
    return null;
  }, [sub, hasEnded, t]);

  if (!date) return null;

  return (
    <List>
      <ListItem>
        <ListItemLeft size="sm">
          <ListItemIcon
            icon={CalendarIcon}
            className="bg-primary"
            iconClassName="text-white h-4 w-4"
          />
        </ListItemLeft>
        <ListItemBody size="md">
          <div>
            <div className="text-xs text-hint">{date?.label}</div>
            <div className="text-sm">{date?.date}</div>
          </div>
          {date?.type === "renewal" && (
            <div className="ml-auto text-sm font-medium text-primary">
              {date.relative}
            </div>
          )}
        </ListItemBody>
      </ListItem>
      {date?.type === "renewal" && <ReminderDate />}
    </List>
  );
};

const ReminderDate = () => {
  const { user } = useProfile();
  const { sub, updateReminder } = useSubCtx();
  const contrib = sub.contribs.find((v) => v.userId === user.id);

  if (!contrib) return null;

  return (
    <ReminderInput reminder={contrib.reminder} setReminder={updateReminder} />
  );
};
