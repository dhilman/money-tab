import {
  ChartPieIcon,
  DollarSignIcon,
  ListIcon,
  PencilIcon,
  PercentIcon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import {
  getSplitValue,
  PERCENTAGE_SCALE,
  type Participant,
  type SplitMode,
} from "~/components/common/participants/reducer";
import { PartyUserName } from "~/components/common/participants/username";
import { useCurrencyAmountParser } from "~/components/form/amount-utils";
import { UserAvatarOrPlaceholder } from "~/components/pages/user/user-avatar";
import { useUser } from "~/components/provider/users-provider";
import {
  ItemizedSection,
  useItemizedCaption,
  useReceiptCtxOptional,
} from "~/components/receipt";
import { ButtonV1 } from "~/components/ui/buttonv1";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemIcon,
  ListItemLeft,
} from "~/components/ui/list-item";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import { cn } from "~/lib/utils";

interface Props {
  onEdit: () => void;
  onEditPayer: () => void;
}

export const ParticipantsOverview = ({ onEdit, onEditPayer }: Props) => {
  const { t } = useTranslation();
  const { parties, payerId, splitMode, setSplitMode } = useParticipantsCtx();
  const receiptCtx = useReceiptCtxOptional();
  const itemizedAvailable =
    parties.length >= 2 && (receiptCtx?.receipt?.items.length ?? 0) > 0;

  // Itemized mode requires a scanned receipt with items and at least two
  // participants; fall back to amount mode otherwise. Lives here (not in
  // SplitModeTabs) so it still runs when the split UI below is unmounted.
  useEffect(() => {
    if (splitMode === "itemized" && !itemizedAvailable) {
      setSplitMode("amount");
    }
  }, [splitMode, itemizedAvailable, setSplitMode]);

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
      <SplitModeTabs itemizedAvailable={itemizedAvailable} />
      <UsersPaidFor />
    </Bento>
  );
};

const SplitModeTabs = ({
  itemizedAvailable,
}: {
  itemizedAvailable: boolean;
}) => {
  const { splitMode, setSplitMode } = useParticipantsCtx();

  return (
    <Tabs
      value={splitMode}
      onValueChange={(v) => setSplitMode(v as SplitMode)}
      className="w-full"
    >
      <TabsList className="w-full">
        <TabsTrigger value="amount" className="flex-1">
          <DollarSignIcon className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="percentage" className="flex-1">
          <PercentIcon className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="shares" className="flex-1">
          <ChartPieIcon className="h-4 w-4" />
        </TabsTrigger>
        {itemizedAvailable && (
          <TabsTrigger value="itemized" className="flex-1">
            <ListIcon className="h-4 w-4" />
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
};

const UsersPaidFor = () => {
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const { parties, splitMode } = useParticipantsCtx();

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
      {splitMode === "itemized" && <ItemizedSection />}
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
  const { t } = useTranslation();
  const user = useUser(participant.id);
  const {
    currency,
    splitMode,
    setSplitValue,
    resetSplitValue,
    invalid,
    payerId,
    meId,
  } = useParticipantsCtx();
  const { decimals, parser } = useCurrencyAmountParser(currency);
  const [value, setValue] = useState("");
  const itemizedCaption = useItemizedCaption(participant.id);

  // Reset input value when split mode changes
  useEffect(() => {
    setValue("");
  }, [splitMode]);

  const splitVal = getSplitValue(participant, splitMode);
  const isManual = splitVal.manual;
  const isItemized = splitMode === "itemized";

  const placeholder = useMemo(() => {
    switch (splitMode) {
      case "amount":
        return (participant.amount / 10 ** decimals).toFixed(decimals);
      case "percentage":
        return (splitVal.value / PERCENTAGE_SCALE).toFixed(2);
      case "shares":
        return splitVal.value.toString();
      case "itemized":
        return "";
    }
  }, [splitMode, participant.amount, splitVal.value, decimals]);

  const amountOwed = formatAmountCurrency(participant.amount, currency);
  const isPayer = participant.id === payerId;
  const isMe = participant.id === meId;
  const iAmPayer = meId === payerId;

  // Determine the share label based on who paid and who this participant is
  const getShareLabel = () => {
    if (iAmPayer) {
      // I paid: my share vs others owe
      return isMe
        ? t("your_share", { amount: amountOwed })
        : t("owes", { amount: amountOwed });
    } else {
      // Someone else paid: their share vs I owe vs others owe
      if (isPayer) {
        return t("their_share", { amount: amountOwed });
      }
      return isMe
        ? t("you_owe_amount", { amount: amountOwed })
        : t("owes", { amount: amountOwed });
    }
  };

  const parseInputValue = (v: string): number | null => {
    switch (splitMode) {
      case "amount":
        return parser(v);
      case "percentage":
        if (!/^\d*\.?\d{0,2}$/.test(v)) return null;
        const num = parseFloat(v);
        if (isNaN(num)) return null;
        return Math.round(num * PERCENTAGE_SCALE);
      case "shares":
        if (!/^\d+$/.test(v)) return null;
        const int = parseInt(v, 10);
        return isNaN(int) ? null : int;
      case "itemized":
        return null;
    }
  };

  const onInputChange = (v: string) => {
    if (v === "") {
      setValue("");
      setSplitValue(participant.id, 0);
      return;
    }
    const parsed = parseInputValue(v);
    if (parsed === null) return;
    setSplitValue(participant.id, parsed);
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
        <div className="w-full truncate">
          <PartyUserName user={user} />
          <div className="text-sm text-hint">
            {isItemized && itemizedCaption !== null
              ? itemizedCaption
              : getShareLabel()}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isItemized ? (
            <span className="px-3 text-right text-base text-foreground">
              {participant.amount > 0
                ? formatAmountCurrency(participant.amount, currency)
                : "—"}
            </span>
          ) : (
            <>
              {isManual && (
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-[8.91px] bg-tertiary"
                  onClick={() => {
                    setValue("");
                    resetSplitValue(participant.id);
                  }}
                >
                  <RefreshCwIcon className="h-4 w-4 text-foreground" />
                </button>
              )}
              <input
                ref={setRef}
                className={cn(
                  "w-20 rounded-[8.91px] bg-tertiary px-3 py-[5px] text-right text-base",
                  isManual && invalid && "bg-red-500/20",
                )}
                type="number"
                enterKeyHint="next"
                placeholder={placeholder}
                autoComplete="off"
                autoCorrect="off"
                value={value}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </>
          )}
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
