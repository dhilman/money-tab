import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { ListUserRadio } from "~/components/common/participants/select/list-user-radio";
import { RadioCheck } from "~/components/common/participants/select/radio-check";
import { TextInput } from "~/components/form/text-input";
import { GroupAvatar } from "~/components/pages/group/group-avatar";
import { UserAvatarOrPlaceholder } from "~/components/pages/user/user-avatar";
import { useContacts } from "~/components/provider/auth/auth-provider";
import { useGroups, useUser } from "~/components/provider/users-provider";
import { ButtonV1 } from "~/components/ui/buttonv1";
import { Drawer, DrawerContent, DrawerTrigger } from "~/components/ui/drawer";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import { cn } from "~/lib/utils";

interface Props {
  query: string;
  userId: string | null;
  groupId: string | null;
  numUsers: number | null;
  setQuery: (query: string) => void;
  setUserId: (userId: string | null) => void;
  setGroupId: (groupId: string | null) => void;
  setNumUsers: (numContribs: number) => void;
}

const PARTICIPANT_OPTIONS = [
  { value: "", label: "--" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5+" },
];

export const TxListSearch = (props: Props) => {
  const { t } = useTranslation();
  return (
    <Bento className="flex flex-col gap-2">
      <div
        className={cn(
          "flex h-9 w-full items-center gap-1 rounded-lg bg-hint/10 px-3 text-hint",
          "bg-[#747480]/[0.12] text-foreground dark:bg-[#767680]/[0.24]"
        )}
      >
        <SearchIcon className="h-5 w-5 text-hint" />
        <TextInput
          className="h-7 w-full bg-transparent pl-1 pr-2 text-sm"
          placeholder={t("search_txs")}
          value={props.query}
          onChange={(v) => props.setQuery(v)}
        />
      </div>
      <div className="flex w-full gap-2 overflow-y-auto">
        <UserSelectDrawer {...props} />
        <GroupSelectDrawer {...props} />
      </div>
    </Bento>
  );
};

interface UserSelectDrawerProps {
  userId: string | null;
  setUserId: (userId: string | null) => void;
}

const UserSelectDrawer = ({ userId, setUserId }: UserSelectDrawerProps) => {
  const { t } = useTranslation();
  const contacts = useContacts();
  const [open, setOpen] = useState(false);
  const user = useUser(userId);

  function TriggerContent() {
    if (!user) return <>{t("contact")}</>;
    return (
      <>
        <UserAvatarOrPlaceholder size="sm" user={user} />
        <div>{user.name}</div>
      </>
    );
  }

  if (!contacts.length) return null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <ButtonV1
          variant="tertiary"
          size="picker"
          className="gap-1.5 rounded-full border border-hint/20 px-4 py-1.5 font-medium"
        >
          <TriggerContent />
        </ButtonV1>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <Bento className="flex w-full flex-col gap-4 overflow-y-auto pb-8">
          <div className="w-full text-lg font-semibold">
            {t("filter_by_contact")}
          </div>
          <BentoContent>
            {contacts.map((u) => (
              <ListUserRadio
                key={u.id}
                userId={u.id}
                selected={userId === u.id}
                onToggle={() => {
                  setUserId(userId === u.id ? null : u.id);
                  setOpen(false);
                }}
                className="pl-0"
              />
            ))}
          </BentoContent>
        </Bento>
      </DrawerContent>
    </Drawer>
  );
};

interface GroupSelectDrawerProps {
  groupId: string | null;
  setGroupId: (groupId: string | null) => void;
}

const GroupSelectDrawer = ({ groupId, setGroupId }: GroupSelectDrawerProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const groups = useGroups();
  const group = groups.find((g) => g.id === groupId);

  function TriggerContent() {
    if (!group) return <>{t("group")}</>;
    return (
      <>
        <GroupAvatar group={group} size="sm" />
        <div>{group.name}</div>
      </>
    );
  }

  if (!groups.length) return null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <ButtonV1
          variant="tertiary"
          size="picker"
          className="gap-1.5 rounded-full border border-hint/20 px-4 py-1.5 font-medium"
        >
          <TriggerContent />
        </ButtonV1>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <Bento className="flex w-full flex-col gap-4 overflow-y-auto pb-8">
          <div className="w-full text-lg font-semibold">
            {t("filter_by_group")}
          </div>
          <BentoContent>
            {groups.map((g) => (
              <ListItem
                key={g.id}
                as="button"
                className="pl-0"
                onClick={() => {
                  setGroupId(groupId === g.id ? null : g.id);
                  setOpen(false);
                }}
              >
                <ListItemLeft>
                  <GroupAvatar group={g} size="xl" />
                </ListItemLeft>
                <ListItemBody>
                  {g.name}
                  <RadioCheck selected={groupId === g.id} className="ml-auto" />
                </ListItemBody>
              </ListItem>
            ))}
          </BentoContent>
        </Bento>
      </DrawerContent>
    </Drawer>
  );
};
