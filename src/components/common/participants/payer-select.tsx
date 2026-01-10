import { CheckIcon } from "lucide-react";
import { Bento } from "~/components/bento-box";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { PartyUserName } from "~/components/common/participants/username";
import { UserAvatarOrPlaceholder } from "~/components/pages/user/user-avatar";
import { useUser } from "~/components/provider/users-provider";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import { cn } from "~/lib/utils";

interface Props {
  onSelected: () => void;
}

export const PayerSelect = ({ onSelected }: Props) => {
  const { parties, payerId, setPayerId } = useParticipantsCtx();
  return (
    <Bento>
      <List>
        {parties.map((p) => (
          <UserListItem
            key={p.id}
            userId={p.id}
            isPayer={p.id === payerId}
            onSelect={() => {
              setPayerId(p.id);
              onSelected();
            }}
          />
        ))}
      </List>
    </Bento>
  );
};

interface UserListItemProps {
  userId: string;
  isPayer: boolean;
  onSelect: (value: string) => void;
}

const UserListItem = ({ userId, isPayer, onSelect }: UserListItemProps) => {
  const user = useUser(userId);

  return (
    <ListItem as="button" onClick={() => onSelect(userId)}>
      <ListItemLeft>
        <UserAvatarOrPlaceholder user={user} size="xl" accentHash={userId} />
      </ListItemLeft>
      <ListItemBody>
        <PartyUserName user={user} />
        {isPayer && (
          <div
            className={cn(
              "ml-auto flex h-[22px] w-[22px] shrink-0 items-center justify-center",
              "text-primary-foreground rounded-full border-[1.5px]",
              "border-primary bg-primary",
            )}
          >
            <CheckIcon className="h-4 w-4" />
          </div>
        )}
      </ListItemBody>
    </ListItem>
  );
};
