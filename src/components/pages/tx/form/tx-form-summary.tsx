import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CurrencyAmount } from "~/components/amount";
import { Bento, BentoContent } from "~/components/bento-box";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { FormLabel } from "~/components/form/form";
import { useTxEditCtx } from "~/components/pages/tx/form/tx-form-ctx";
import { useMe } from "~/components/provider/auth/auth-provider";
import { ListItem, ListItemBody } from "~/components/ui/list-item";
import i18n from "~/lib/i18n";
import { cn } from "~/lib/utils";
import { reduceArr } from "~/utils/array";

export const TxEditSummary = () => {
  const me = useMe();
  const { t } = useTranslation();
  const { parties, payerId } = useParticipantsCtx();
  const { amount, currency } = useTxEditCtx();

  const summary = useMemo(() => {
    const isPayer = me.id === payerId;
    const meParty = parties.find((p) => p.id === me.id);

    // Invalid state - user not a participant
    if (!meParty || (!isPayer && meParty.amount === 0)) {
      return {
        amount: 0,
        prefix: i18n.t("you_paid"),
        color: "text-hint",
      };
    }

    // No paid for users (special case - personal expense)
    // or only paid for user is the user
    if (parties.length === 1) {
      return {
        amount: amount,
        prefix: i18n.t("you_paid"),
        color: "text-red-500",
      };
    }

    if (isPayer) {
      return {
        amount: reduceArr(
          parties,
          (acc, p) => acc + p.amount,
          0,
          (p) => p.id !== me.id,
        ),
        prefix: i18n.t("you_are_owed"),
        color: "text-green-500",
      };
    }

    return {
      amount: meParty.amount,
      prefix: i18n.t("you_owe"),
      color: "text-red-500",
    };
  }, [amount, me.id, parties, payerId]);

  return (
    <Bento>
      <BentoContent>
        <ListItem>
          <ListItemBody className="justify-between">
            <FormLabel>{t("summary")}</FormLabel>
            <div className="w-full text-right text-hint">
              <span>{summary.prefix}</span>
              <CurrencyAmount
                as="span"
                size="lg"
                className={cn("ml-1.5 font-semibold", summary.color)}
                amount={summary.amount}
                currency={currency}
                color="none"
              />
            </div>
          </ListItemBody>
        </ListItem>
      </BentoContent>
    </Bento>
  );
};
