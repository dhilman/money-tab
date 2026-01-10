import { PencilIcon, PlusIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import type { Participant } from "~/components/common/participants/reducer";
import { PartyUserName } from "~/components/common/participants/username";
import { useCurrencyAmountParser } from "~/components/form/amount-utils";
import { UserAvatarOrPlaceholder } from "~/components/pages/user/user-avatar";
import { useUser } from "~/components/provider/users-provider";
import { ButtonV1 } from "~/components/ui/buttonv1";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemIcon,
  ListItemLeft,
} from "~/components/ui/list-item";
import { cn } from "~/lib/utils";

interface Props {
  onEdit: () => void;
  onEditPayer: () => void;
}

export const ParticipantsOverview = ({ onEdit, onEditPayer }: Props) => {
  const { t } = useTranslation();
  const { parties, payerId } = useParticipantsCtx();

  if (parties.length < 2) {
    return (
      <Bento className="gap-3">
        <div className="w-full px-2 font-semibold capitalize">
          {t("participants")}
        </div>
        <ListButton onClick={onEdit} icon={PlusIcon}>
          {t("add")} {t("participants")}
        </ListButton>
      </Bento>
    );
  }

  return (
    <Bento className="gap-3">
      <div className="w-full px-2 font-semibold capitalize">
        {t("participants")}
      </div>
      <ListButton onClick={onEdit} icon={PencilIcon}>
        {t("edit")} {t("participants")}
      </ListButton>
      <List>
        <UserPaidBy userId={payerId} onEditPayer={onEditPayer} />
      </List>
      <UsersPaidFor />
    </Bento>
  );
};

const UsersPaidFor = () => {
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const { parties } = useParticipantsCtx();

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, parties.length);
  }, [parties]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const idx = inputRefs.current.indexOf(e.currentTarget);
      if (idx === -1) return;
      const next = inputRefs.current[idx + 1];
      if (next) next.focus();
      else e.currentTarget.blur();
    }
  };

  return (
    <List>
      {parties.map((p, i) => (
        <UserListItem
          key={p.id}
          participant={p}
          setRef={(el) => (inputRefs.current[i] = el)}
          onKeyDown={onKeyDown}
        />
      ))}
    </List>
  );
};

interface UserPaidByProps {
  userId: string;
  onEditPayer: () => void;
}

const UserPaidBy = ({ userId, onEditPayer }: UserPaidByProps) => {
  const user = useUser(userId);
  const { t } = useTranslation();
  return (
    <ListItem>
      <ListItemLeft>
        <UserAvatarOrPlaceholder user={user} size="xl" accentHash={userId} />
      </ListItemLeft>
      <ListItemBody>
        <div className="w-full truncate">
          <PartyUserName user={user} />
          <div className="text-sm text-hint">{t("paid_by")}</div>
        </div>
        <ButtonV1
          variant="secondary"
          size="badge"
          className="ml-auto"
          onClick={onEditPayer}
        >
          {t("change")}
        </ButtonV1>
      </ListItemBody>
    </ListItem>
  );
};

interface UserListItemProps {
  setRef?: (el: HTMLInputElement) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  participant: Participant;
}

const UserListItem = ({
  setRef,
  onKeyDown,
  participant,
}: UserListItemProps) => {
  const user = useUser(participant.id);
  const { currency, setAmount, resetAmount, invalid } = useParticipantsCtx();
  const { decimals, parser } = useCurrencyAmountParser(currency);
  const original = useMemo(
    () => (participant.amount / 10 ** decimals).toFixed(decimals),
    [participant.amount, decimals],
  );
  const [value, setValue] = useState("");

  const onAmountChange = (v: string) => {
    if (v === "") {
      setValue("");
      setAmount(participant.id, 0);
      return;
    }
    const int = parser(v);
    if (int === null) return;
    setAmount(participant.id, int);
    setValue(v);
  };

  return (
    <ListItem>
      <ListItemLeft>
        <UserAvatarOrPlaceholder
          user={user}
          size="xl"
          accentHash={participant.id}
        />
      </ListItemLeft>

      <ListItemBody>
        <PartyUserName user={user} />
        <div className="ml-auto flex items-center gap-2">
          {participant.manual && (
            <button
              className="flex h-8 w-8 items-center justify-center rounded-[8.91px] bg-tertiary"
              onClick={() => {
                setValue("");
                resetAmount(participant.id);
              }}
            >
              <RefreshCwIcon className="h-4 w-4 text-foreground" />
            </button>
          )}
          <input
            ref={setRef}
            className={cn(
              "w-20 rounded-[8.91px] bg-tertiary px-3 py-[5px] text-right text-base",
              participant.manual && invalid && "bg-red-500/20",
            )}
            type="number"
            enterKeyHint="next"
            placeholder={original}
            autoComplete="off"
            autoCorrect="off"
            value={value}
            onChange={(e) => onAmountChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
      </ListItemBody>
    </ListItem>
  );
};

interface ListButtonProps {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const ListButton = ({ onClick, icon, children }: ListButtonProps) => {
  return (
    <ListItem as="button" onClick={onClick} className="bg-background text-link">
      <ListItemLeft className="pl-1.5">
        <ListItemIcon icon={icon} />
      </ListItemLeft>
      <ListItemBody size="sm" className="border-0">
        {children}
      </ListItemBody>
    </ListItem>
  );
};
