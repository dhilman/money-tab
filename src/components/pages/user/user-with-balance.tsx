import { ChevronRightIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CurrencyAmount } from "~/components/amount";
import { UserAvatar } from "~/components/pages/user/user-avatar";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { useUser } from "~/components/provider/users-provider";
import { MyLink } from "~/components/router/link";
import { avatarVariants } from "~/components/ui/avatar";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import { convertAmount } from "~/lib/amount/conversion";
import { cn } from "~/lib/utils";

export const UserWithBalanceLoadingList = () => {
  return (
    <List>
      {[1, 2, 3].map((i) => (
        <UserWithBalanceLoading key={i} />
      ))}
    </List>
  );
};

export const UserWithBalanceLoading = () => {
  return (
    <ListItem>
      <ListItemLeft>
        <div
          className={cn(
            avatarVariants({ size: "xl" }),
            "animate-pulse bg-canvas/50",
          )}
        />
      </ListItemLeft>
      <ListItemBody>
        <div className="flex h-full w-full items-center justify-between gap-3">
          <div className="h-4 w-20 animate-pulse rounded-md bg-canvas" />
          <div className="h-4 w-10 animate-pulse rounded-md bg-canvas" />
        </div>
      </ListItemBody>
    </ListItem>
  );
};

interface Props {
  userId: string;
}

export const UserWithBalance = ({ userId }: Props) => {
  const { t } = useTranslation();
  const user = useUser(userId);
  const balance = useUserBalance(userId);

  if (!user) return null;

  return (
    <ListItem
      as={MyLink}
      route={{ pathname: "/webapp/user/[id]", query: { id: userId } }}
    >
      <ListItemLeft>
        <UserAvatar size="xl" user={user} />
      </ListItemLeft>
      <ListItemBody className="gap-4 truncate">
        <div className="w-full truncate text-base font-medium whitespace-nowrap">
          {user.name}
        </div>
        {balance && (
          <div className="ml-auto flex shrink-0 flex-col items-end">
            <div className="inline-flex shrink-0 items-center justify-center gap-1">
              <CurrencyAmount
                size="base"
                amount={balance.amount}
                currency={balance.currency}
                color="amount"
                className="font-semibold"
              />
              <ChevronRightIcon className="h-4 w-4 text-hint/50" />
            </div>
            {balance.n > 1 && (
              <div className="text-sm text-hint">
                {t("currencies", { count: balance.n })}
              </div>
            )}
          </div>
        )}
      </ListItemBody>
    </ListItem>
  );
};

const useUserBalance = (userId: string) => {
  const { user, balances, currencyCode } = useProfile();
  return useMemo(() => {
    if (user.hideBalance) return null;

    const userBalances = balances.filter(
      (b) => b.userId === userId && b.amount !== 0,
    );
    const total = userBalances.reduce((acc, b) => {
      return acc + convertAmount(b.amount, b.currencyCode, currencyCode);
    }, 0);

    let color = "text-hint/50";
    if (total > 0) {
      color = "text-green-500 bg-green-500/5";
    } else if (total < 0) {
      color = "text-red-500 bg-red-500/5";
    }

    return {
      amount: total,
      currency: currencyCode,
      color: color,
      n: userBalances.length,
    };
  }, [user.hideBalance, balances, currencyCode, userId]);
};
