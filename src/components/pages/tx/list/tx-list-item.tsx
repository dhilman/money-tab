import { ChevronRightIcon } from "lucide-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CurrencyAmount } from "~/components/amount";
import { TxIcon, type Operation } from "~/components/pages/tx/list/tx-icon";
import { UserNamesList } from "~/components/pages/user/user-names";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { LoadingText } from "~/components/provider/states-provider";
import { MyLink } from "~/components/router/link";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import { cn } from "~/lib/utils";
import { type RouterOutputs } from "~/utils/api";

type Transaction = RouterOutputs["user"]["start"]["transactions"][number];

interface TxDefaultProps {
  transaction: Transaction;
}

export const TxDefault = ({ transaction }: TxDefaultProps) => {
  return (
    <TxContainer transaction={transaction}>
      <TxDescription desc={transaction.description} type={transaction.type} />
      <TxUsers contribs={transaction.contribs} />
    </TxContainer>
  );
};

export const TxLoading = () => {
  return (
    <ListItem>
      <ListItemLeft>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas/50">
          <div className="h-6 w-6 animate-pulse rounded-lg bg-canvas/50" />
        </div>
      </ListItemLeft>
      <ListItemBody className="h-16 gap-4">
        <div className="w-fit truncate text-left text-sm">
          <LoadingText text="hello" />
        </div>
        <div className="ml-auto flex shrink-0 flex-col items-end justify-center gap-1">
          <div className="inline-flex items-center justify-center gap-1">
            <LoadingText text="20.00" className="text-sm font-semibold" />
            <ChevronRightIcon className="h-4 w-4 text-hint/50" />
          </div>
          <div className="h-4 w-16 rounded-md bg-canvas/50" />
        </div>
      </ListItemBody>
    </ListItem>
  );
};

interface BaseTransaction {
  id: string;
  createdAt: string;
  description: string | null;
  currencyCode: string;
  net: number;
  type: "PAYMENT" | "SETTLE";
}

interface TxContainerProps {
  transaction: BaseTransaction;
  children: React.ReactNode;
}

export const TxContainer = ({ transaction, children }: TxContainerProps) => {
  const style = getTransactionStyling(transaction);

  return (
    <ListItem
      as={MyLink}
      route={{ pathname: "/webapp/tx/[id]", query: { id: transaction.id } }}
    >
      <ListItemLeft>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            style.colorbg
          )}
        >
          <TxIcon
            operation={style.icon}
            className={cn(
              "shrink-0 rounded-full bg-white stroke-[2.5px] p-1.5",
              "h-[26px] w-[26px]",
              style.color
            )}
          />
        </div>
      </ListItemLeft>

      <ListItemBody className="h-16 w-full gap-4 overflow-hidden">
        {/* Counterparty + Description */}
        <div className="w-full truncate text-ellipsis text-left">
          {children}
        </div>

        {/* Amount */}
        <div className="ml-auto flex shrink-0 flex-col items-end justify-center">
          <CurrencyAmount
            className={cn("font-semibold", style.color)}
            amount={transaction.net}
            currency={transaction.currencyCode}
            size="base"
            color="none"
          />
        </div>
      </ListItemBody>
    </ListItem>
  );
};

interface TxDescriptionProps {
  className?: string;
  type: Transaction["type"];
  desc: string | null;
}

export const TxDescription = ({
  className,
  type,
  desc,
}: TxDescriptionProps) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "w-full max-w-full truncate whitespace-nowrap text-base",
        className
      )}
    >
      {type === "SETTLE" ? t("settlement") : desc || t("no_desc")}
    </div>
  );
};

interface TxUsersProps {
  contribs: { userId: string | null }[];
}

const TxUsers = ({ contribs }: TxUsersProps) => {
  const { user: me } = useProfile();
  const others = useMemo(() => {
    return contribs
      .filter((c) => c.userId !== me.id)
      .filter((c) => c.userId !== null);
  }, [contribs, me]);

  if (others.length === 0) return null;

  return (
    <UserNamesList
      className="text-sm text-hint"
      userIds={others.map((c) => c.userId as string)}
    />
  );
};

interface TransactionStyling {
  color: string;
  colorbg: string;
  icon: Operation;
}

function getTransactionStyling(tr: BaseTransaction): TransactionStyling {
  if (tr.type === "SETTLE") {
    return {
      color: "text-blue-500",
      colorbg: "bg-gradient-to-b from-cyan-300 to-blue-500",
      icon: "settle",
    };
  }

  if (tr.net === 0) {
    return {
      color: "text-hint",
      colorbg: "bg-gradient-to-b from-hint/50 to-hint/50",
      icon: "borrow",
    };
  }

  if (tr.net < 0) {
    return {
      color: "text-red-500",
      colorbg: "bg-gradient-to-b from-pink-300 to-red-500",
      icon: "borrow",
    };
  }

  return {
    color: "text-green-500",
    colorbg: "bg-gradient-to-b from-green-300 to-green-500",
    icon: "lend",
  };
}
