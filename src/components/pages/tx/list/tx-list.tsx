import dayjs from "dayjs";
import { ListIcon } from "lucide-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TxDefault, TxLoading } from "~/components/pages/tx/list/tx-list-item";
import { LoadingText } from "~/components/provider/states-provider";
import { MyLink } from "~/components/router/link";
import {
  AnimatedImage,
  AnimatedImageContainer,
} from "~/components/ui/animated-image";
import { ButtonV1 } from "~/components/ui/buttonv1";
import { IconBox } from "~/components/ui/iconv1";
import { List } from "~/components/ui/list";
import { formatDate } from "~/lib/dates/format-dates";
import type { RouterOutputs } from "~/utils/api";
import { toMapGrouped } from "~/utils/map";

type Transaction = RouterOutputs["user"]["start"]["transactions"][number];

interface Source {
  userId?: string;
  groupId?: string;
}

interface TxListStatefullProps {
  source?: Source;
  isLoading?: boolean;
  txs: Transaction[];
  hideCreate?: boolean;
}

export function TxListStatefull({
  source,
  isLoading,
  txs,
}: TxListStatefullProps) {
  const grouped = useMemo(() => {
    const byDay = toMapGrouped(txs, (tx) => {
      const date = tx.date ?? tx.createdAt;
      return dayjs(date, { utc: true }).format("YYYY-MM-DD");
    });
    return [...byDay.entries()].map(([date, txs]) => ({
      date: formatDate(date, { utc: false }),
      transactions: txs,
    }));
  }, [txs]);

  if (isLoading) return <Loading />;
  if (txs.length === 0) return <Empty source={source} />;

  return (
    <div className="flex w-full flex-col">
      {grouped.map((v) => (
        <div key={v.date}>
          <Header>{v.date}</Header>
          <List>
            {v.transactions.map((tx) => (
              <TxDefault key={tx.id} transaction={tx} />
            ))}
          </List>
        </div>
      ))}
      {txs.length > 9 && <ViewMoreButton source={source} />}
    </div>
  );
}

interface ViewMoreButtonProps {
  source?: Source;
}

function ViewMoreButton({ source }: ViewMoreButtonProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full p-4">
      <ButtonV1 size="lg" variant="tertiary" className="w-full gap-2" asChild>
        <MyLink route={{ pathname: "/webapp/txs", query: source }}>
          <IconBox className="h-6 w-6">
            <ListIcon className="h-5 w-5 text-foreground" />
          </IconBox>
          {t("expense_history")}
        </MyLink>
      </ButtonV1>
    </div>
  );
}

function Header({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full px-4 py-[5px] text-sm text-hint uppercase">
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex w-full flex-col">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <Header>
            <LoadingText text="hello world" />
          </Header>
          <List>
            {Array.from({ length: 3 }).map((_, i) => (
              <TxLoading key={i} />
            ))}
          </List>
        </div>
      ))}
    </div>
  );
}

interface EmptyParams {
  source?: Source;
  hideCreate?: boolean;
}

function Empty({ source, hideCreate }: EmptyParams) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full flex-col items-center px-7 pt-4 pb-8">
      <AnimatedImageContainer>
        <AnimatedImage name="abacus" />
      </AnimatedImageContainer>
      <div className="mt-2.5 text-center text-base font-semibold">
        {t("your_expenses_will_be_here")}
      </div>
      {!hideCreate && (
        <MyLink
          route={{ pathname: "/webapp/tx/create", query: source }}
          className="mt-4 text-sm font-semibold text-link"
        >
          {t("create_expense")}
        </MyLink>
      )}
    </div>
  );
}
