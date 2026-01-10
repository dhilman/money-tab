import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CurrencyAmount } from "~/components/amount";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { useUserCtx } from "~/components/pages/user/get/user-provider";
import { useSettleMutation } from "~/components/pages/user/user-hooks";
import { ButtonV1 } from "~/components/ui/buttonv1";
import { List } from "~/components/ui/list";
import { ListItem, ListItemBody } from "~/components/ui/list-item";

export const UserBalance = () => {
  const { txs, subs, balances: userBalances } = useUserCtx();
  const { t } = useTranslation();
  const balances = useMemo(() => {
    return userBalances.filter((b) => b.amount !== 0);
  }, [userBalances]);

  if (!balances || balances.length === 0) {
    if (txs.length === 0 && subs.length === 0) return null;
    return (
      <Bento>
        <BentoHeader>{t("balance")}</BentoHeader>
        <BentoContent className="bg-background items-center gap-1.5 px-3 py-4 text-center">
          <span role="img" aria-label="scales" className="text-xl">
            ⚖️
          </span>
          <div className="text-hint text-sm font-medium capitalize">
            {t("no_outstanding_balance")}
          </div>
        </BentoContent>
      </Bento>
    );
  }

  return (
    <Bento>
      <BentoHeader>{t("balance")}</BentoHeader>
      <List>
        {balances.map((b, i) => (
          <UserBalanceListItem
            key={i}
            userId={b.userId}
            amount={b.amount}
            currency={b.currencyCode}
          />
        ))}
      </List>
    </Bento>
  );
};

interface UserBalanceListItemProps {
  userId: string;
  amount: number;
  currency: string;
}

export const UserBalanceListItem = ({
  userId,
  amount,
  currency,
}: UserBalanceListItemProps) => {
  const { t } = useTranslation();
  const { settle, isLoading } = useSettleMutation({
    userId,
    amount,
    currencyCode: currency,
  });

  return (
    <ListItem>
      <ListItemBody>
        <div>
          <CurrencyAmount
            size="lg"
            className="font-semibold"
            amount={amount}
            currency={currency}
            color="amount"
          />
          <div className="text-hint text-sm">
            {amount > 0 ? t("owed_to_you") : t("you_owe")}
          </div>
        </div>
        <ButtonV1
          size="badge"
          onClick={settle}
          variant="secondary"
          className="ml-auto normal-case"
          disabled={isLoading}
        >
          {t("mark_settled")}
        </ButtonV1>
      </ListItemBody>
    </ListItem>
  );
};
