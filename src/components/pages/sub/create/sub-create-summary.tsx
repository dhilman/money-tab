import dayjs from "dayjs";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CurrencyAmount } from "~/components/amount";
import { Bento, BentoHeader } from "~/components/bento-box";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { SubFrequency } from "~/components/pages/sub/sub-freq";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { List } from "~/components/ui/list";
import { ListItem, ListItemBody } from "~/components/ui/list-item";
import type { Currency } from "~/lib/amount/currencies";
import type { Cycle } from "~/lib/consts/types";
import { addCycles } from "~/lib/dates/conversions";
import { formatDate } from "~/lib/dates/format-dates";
import { calcRenewalDate } from "~/lib/dates/subscription";
import { cn } from "~/lib/utils";
import { reduceArr } from "~/utils/array";

interface Props {
  sub: {
    amount: number;
    currency: Currency;
    startDate: string;
    endDate: string | null;
    cycle: Cycle;
    trial: Cycle | null;
  };
}

/**
 * When creator is the only participant display: price, start date
 * When creator is payer display: price, owed to you, start date
 * When creator is not payer display: price, your share, start date
 */
export const SubCreateSummary = ({ sub }: Props) => {
  const { parties, payerId } = useParticipantsCtx();
  const { user } = useProfile();
  const { t } = useTranslation();
  const isPayer = payerId === user.id;

  const share = useMemo(() => {
    // Don't display share if no other participants
    if (parties.length < 2) return null;

    const meParty = parties.find((p) => p.id === user.id);
    if (!meParty) return null;

    if (meParty.amount > 0) return meParty.amount;
    if (!isPayer) return null;

    return reduceArr(
      parties,
      (acc, p) => acc + p.amount,
      0,
      (p) => p.id !== user.id,
    );
  }, [parties, user.id, isPayer]);

  const firstPayment = useMemo(() => {
    let startDate = dayjs(sub.startDate);
    if (sub.trial) {
      startDate = addCycles(startDate, sub.trial, 1);
    }
    return calcRenewalDate({
      startDate,
      endDate: sub.endDate,
      cycle: { unit: sub.cycle.unit, value: sub.cycle.value },
    });
  }, [sub.startDate, sub.endDate, sub.cycle, sub.trial]);

  function Share() {
    if (share === null) return null;
    return (
      <ListItem>
        <ListItemBody size="md" className="justify-between gap-2">
          <div className="text-hint">
            {isPayer ? t("owed_to_you") : t("you_owe")}
          </div>
          <div
            className={cn(
              "ml-auto inline-flex items-center font-medium",
              isPayer ? "text-green-500" : "text-red-500",
            )}
          >
            <CurrencyAmount
              className="mr-1"
              amount={share}
              currency={sub.currency}
              color="none"
            />
            <span className="lowercase">
              <SubFrequency unit={sub.cycle.unit} value={sub.cycle.value} />
            </span>
          </div>
        </ListItemBody>
      </ListItem>
    );
  }

  return (
    <Bento className="gap-1.5">
      <BentoHeader>{t("summary")}</BentoHeader>
      <List>
        <ListItem>
          <ListItemBody size="md" className="justify-between gap-2">
            <div className="text-hint">{t("price")}</div>
            <div className="ml-auto inline-flex items-center font-medium">
              <CurrencyAmount
                className="mr-1"
                amount={sub.amount}
                currency={sub.currency}
              />
              <span className="lowercase">
                <SubFrequency unit={sub.cycle.unit} value={sub.cycle.value} />
              </span>
            </div>
          </ListItemBody>
        </ListItem>
        <Share />
        <ListItem>
          <ListItemBody size="md" className="justify-between gap-2">
            <div className="text-hint">{t("next_renewal")}</div>
            <div className="ml-auto font-medium">
              {firstPayment ? formatDate(firstPayment) : "N/A"}
            </div>
          </ListItemBody>
        </ListItem>
      </List>
    </Bento>
  );
};
