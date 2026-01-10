import { PlusIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { UserAvatarOrPlaceholder } from "~/components/pages/user/user-avatar";
import { useMe } from "~/components/provider/auth/auth-provider";
import { useUser } from "~/components/provider/users-provider";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import { cn } from "~/lib/utils";

interface User {
  id: string;
}

interface Props {
  users: User[];
  onAddNew: () => void;
  onRemove: (value: string) => void;
}

export const SelectedParticipants = ({ users, onAddNew, onRemove }: Props) => {
  const { t } = useTranslation();
  const me = useMe();
  const filtered = useMemo(
    () => users.filter((user) => user.id !== me.id),
    [me.id, users],
  );

  return (
    <Bento>
      <BentoContent>
        <ListItem>
          <ListItemBody className="flex h-fit min-h-[60px] flex-wrap items-center gap-x-3 gap-y-2">
            {filtered.length === 0 && (
              <div className="text-hint">{t("participants")}</div>
            )}
            {filtered.map((v) => (
              <UserItem key={v.id} id={v.id} onRemove={onRemove} />
            ))}
          </ListItemBody>
        </ListItem>
        <AddButton onClick={onAddNew} />
      </BentoContent>
    </Bento>
  );
};

interface UserItemProps {
  id: string;
  onRemove: (value: string) => void;
}

const UserItem = ({ id, onRemove }: UserItemProps) => {
  const { t } = useTranslation();
  const user = useUser(id);
  const [active, setActive] = useState(false);

  return (
    <div
      className={cn(
        "flex max-w-[160px] items-center gap-2 rounded-2xl p-1 pr-3",
        active ? "bg-primary text-primary-foreground" : "bg-canvas",
      )}
      onClick={() => setActive(!active)}
      onBlur={() => setActive(false)}
    >
      {active ? (
        <button
          className="flex h-6 w-6 items-center justify-center rounded-full"
          onClick={() => onRemove(id)}
        >
          <XIcon className="h-5 w-5" />
        </button>
      ) : (
        <UserAvatarOrPlaceholder size="sm" user={user} accentHash={id} />
      )}
      <div className="truncate text-ellipsis">
        {user ? user.name : t("someone_new")}
      </div>
    </div>
  );
};

interface AddButtonProps {
  onClick: () => void;
}

const AddButton = ({ onClick }: AddButtonProps) => {
  const { t } = useTranslation();
  return (
    <ListItem as="button" onClick={onClick} className="bg-background text-link">
      <ListItemLeft className="pl-1.5">
        <PlusIcon />
      </ListItemLeft>
      <ListItemBody size="sm" className="border-0">
        {t("add")} {t("participants")}
      </ListItemBody>
    </ListItem>
  );
};
