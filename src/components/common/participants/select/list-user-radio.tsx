import { useTranslation } from "react-i18next";
import { UserAvatarOrPlaceholder } from "~/components/pages/user/user-avatar";
import { useUser } from "~/components/provider/users-provider";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import { RadioCheck } from "./radio-check";

interface Props {
  className?: string;
  userId: string;
  selected: boolean;
  onToggle: () => void;
}

export const ListUserRadio = ({
  className,
  userId,
  selected,
  onToggle,
}: Props) => {
  const { t } = useTranslation();
  const user = useUser(userId);

  return (
    <ListItem as="button" onClick={onToggle} className={className}>
      <ListItemLeft>
        <UserAvatarOrPlaceholder size="xl" user={user} accentHash={userId} />
      </ListItemLeft>
      <ListItemBody>
        <div className="truncate text-ellipsis font-medium">
          {user?.name || t("someone_new")}
        </div>
        <RadioCheck className="ml-auto" selected={selected} />
      </ListItemBody>
    </ListItem>
  );
};
