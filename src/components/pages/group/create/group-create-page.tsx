import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { ListUserRadio } from "~/components/common/participants/select/list-user-radio";
import { FormTextInput } from "~/components/form/form-text-input";
import { useGroupCreateCtx } from "~/components/pages/group/create/group-create-provider";
import { GroupAvatar } from "~/components/pages/group/group-avatar";
import { UserAvatar } from "~/components/pages/user/user-avatar";
import { useContacts, useMe } from "~/components/provider/auth/auth-provider";
import { useUser } from "~/components/provider/users-provider";
import { getAccentColor } from "~/components/ui/avatar";
import { List } from "~/components/ui/list";
import { ListItem, ListItemBody } from "~/components/ui/list-item";
import { cn } from "~/lib/utils";

export const GroupCreatePage = () => {
  return (
    <WebAppMain>
      <GroupCreateForm />
    </WebAppMain>
  );
};

const GroupCreateForm = () => {
  const { t } = useTranslation();
  const { name, setName, colorId } = useGroupCreateCtx();

  return (
    <div className="flex w-full flex-col items-center gap-4 pb-12">
      <GroupAvatar
        group={{ id: "", name, photoUrl: null, accentColorId: colorId }}
        size="4xl"
      />
      <ColorSelector />
      <div className="h-2" />
      <Bento>
        <BentoContent>
          <FormTextInput
            id="group-name"
            label={t("group_name")}
            value={name}
            onChange={setName}
          />
        </BentoContent>
      </Bento>
      <Members />
      <ContactsSelector />
    </div>
  );
};

const ColorSelector = () => {
  const { colorId, setColorId } = useGroupCreateCtx();

  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <button
          key={i}
          className={cn(
            "h-5 w-5 rounded-full",
            i === colorId && "ring-1 ring-foreground ring-offset-2"
          )}
          style={{
            backgroundColor: getAccentColor(i),
          }}
          onClick={() => setColorId(i)}
        />
      ))}
    </div>
  );
};

const Members = () => {
  const me = useMe();
  const { t } = useTranslation();
  const { userIds } = useGroupCreateCtx();

  return (
    <Bento className="gap-2">
      <div className="w-full px-2 font-semibold">
        {t("members")} ({userIds.length + 1})
      </div>
      <List>
        <ListItem>
          <ListItemBody className="flex h-fit min-h-[60px] flex-wrap items-center gap-x-3 gap-y-2">
            <UserPill userId={me.id} />
            {userIds.map((id) => (
              <UserPill key={id} userId={id} />
            ))}
          </ListItemBody>
        </ListItem>
      </List>
    </Bento>
  );
};

const UserPill = ({ userId }: { userId: string }) => {
  const user = useUser(userId);
  if (!user) return null;

  return (
    <div className="flex max-w-[160px] items-center gap-2 rounded-2xl bg-canvas p-1 pr-3">
      <UserAvatar size="sm" user={user} />
      <div className="truncate text-ellipsis">{user.name}</div>
    </div>
  );
};

const ContactsSelector = () => {
  const { t } = useTranslation();
  const contacts = useContacts();
  const { userIds, toggleUserId } = useGroupCreateCtx();

  if (contacts.length === 0) return null;

  return (
    <Bento className="gap-2">
      <div className="w-full px-2 font-semibold">{t("contacts")}</div>
      <BentoContent>
        {contacts.map((c) => (
          <ListUserRadio
            key={c.id}
            userId={c.id}
            onToggle={() => toggleUserId(c.id)}
            selected={userIds.some((id) => id === c.id)}
          />
        ))}
      </BentoContent>
    </Bento>
  );
};
