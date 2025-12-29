import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { GroupAvatar } from "~/components/pages/group/group-avatar";
import { useTx } from "~/components/pages/tx/get/tx-provider";
import { usePlatform } from "~/components/provider/platform/context";
import { useGroups } from "~/components/provider/users-provider";
import { MyLink } from "~/components/router/link";
import { ButtonV1 } from "~/components/ui/buttonv1";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  ListItem,
  ListItemBody,
  ListItemIcon,
  ListItemLeft,
} from "~/components/ui/list-item";
import { env } from "~/env.mjs";
import { formatDate } from "~/lib/dates/format-dates";
import {
  formatEventDate,
  getGoogleCalendarLink,
  getOutlookCalendarLink,
} from "~/lib/dates/ics";
import { cn } from "~/lib/utils";

export const TxMeta = () => {
  const { tx } = useTx();

  if (!tx.date && !tx.groupId) return null;

  return (
    <Bento>
      <BentoContent>
        <TxDate />
        <TxGroup />
      </BentoContent>
    </Bento>
  );
};

const TxGroup = () => {
  const { t } = useTranslation();
  const { tx } = useTx();
  const groups = useGroups();
  const group = useMemo(
    () => groups.find((g) => g.id === tx.groupId),
    [groups, tx.groupId]
  );

  if (!group) return null;

  return (
    <ListItem
      as={MyLink}
      route={{ pathname: "/webapp/group/[id]", query: { id: group.id } }}
    >
      <ListItemLeft>
        <GroupAvatar group={group} size="xl" />
      </ListItemLeft>
      <ListItemBody>
        <div>
          <div className="text-sm text-hint">{t("group")}</div>
          <div className="text-foreground">{group.name}</div>
        </div>
      </ListItemBody>
    </ListItem>
  );
};

const TxDate = () => {
  const { t } = useTranslation();
  const { tx } = useTx();

  if (!tx.date) return null;

  const isDateTime = tx.date?.length > 10;

  return (
    <ListItem>
      <ListItemLeft>
        <ListItemIcon
          icon={CalendarIcon}
          className={cn(
            "h-10 w-10 rounded-full p-2.5",
            "bg-gradient-to-br from-primary to-primary/40 text-primary-foreground"
          )}
        />
      </ListItemLeft>
      <ListItemBody>
        <div>
          <div className="text-sm text-hint">{t("date")}</div>
          <div className="text-foreground">
            {isDateTime ? formatEventDate(tx.date) : formatDate(tx.date)}
          </div>
        </div>
        {isDateTime && (
          <TxDateDropdown>
            <ButtonV1
              variant="secondary"
              size="badge"
              className="ml-auto capitalize"
            >
              {t("calendar")}
            </ButtonV1>
          </TxDateDropdown>
        )}
      </ListItemBody>
    </ListItem>
  );
};

interface EventDropdownProps {
  children: React.ReactNode;
}

const TxDateDropdown = ({ children }: EventDropdownProps) => {
  const platform = usePlatform();
  const { t } = useTranslation();
  const { tx } = useTx();
  const event = useMemo(() => {
    if (!tx.date) return null;
    return {
      title: tx.description || t("no_desc"),
      start: tx.date,
      end: dayjs(tx.date, { utc: true }).add(1, "hour").toISOString(),
    };
  }, [t, tx.date, tx.description]);

  if (!tx.date) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              if (!event) return;
              const url = getGoogleCalendarLink(event);
              platform.openLink(url);
            }}
          >
            {t("add_to_google_calendar")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (!event) return;
              const url = getOutlookCalendarLink(event);
              platform.openLink(url);
            }}
          >
            {t("add_to_outlook_calendar")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (!event) return;
              const url = new URL(`${env.NEXT_PUBLIC_BASE_URL}/webapp/ics`);
              url.search = new URLSearchParams(event).toString();
              platform.openLink(url.toString());
            }}
          >
            {t("download_event_file")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
