"use client";

import { useTranslation } from "react-i18next";
import { UserAvatarOrPlaceholder } from "~/components/pages/user/user-avatar";
import { useUser } from "~/components/provider/users-provider";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import { useReceiptCtx } from "./receipt-context";

/**
 * Sticky header showing per-person totals with avatars.
 * Displays horizontally scrollable list of participants and their amounts.
 */
export const ReceiptTotalsPreview = () => {
  const { t } = useTranslation();
  const { receipt, personTotals } = useReceiptCtx();

  const currencyCode = receipt?.currencyCode ?? "USD";

  if (personTotals.length === 0) {
    return (
      <div className="rounded-lg bg-hint/5 px-4 py-3">
        <p className="text-center text-sm text-hint">
          {t("receipt.assign_items_hint")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-hint/5 px-3 py-3">
      <div className="flex gap-4 overflow-x-auto pb-1">
        {personTotals.map((pt) => (
          <PersonTotalItem
            key={pt.userId}
            userId={pt.userId}
            itemsSubtotal={pt.itemsSubtotal}
            extrasTotal={pt.extrasTotal}
            total={pt.total}
            currencyCode={currencyCode}
          />
        ))}
      </div>
    </div>
  );
};

interface PersonTotalItemProps {
  userId: string;
  itemsSubtotal: number;
  extrasTotal: number;
  total: number;
  currencyCode: string;
}

const PersonTotalItem = ({
  userId,
  itemsSubtotal,
  extrasTotal,
  currencyCode,
}: PersonTotalItemProps) => {
  const user = useUser(userId);

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <UserAvatarOrPlaceholder size="md" user={user} accentHash={userId} />
      <div className="flex flex-col items-center">
        <span className="text-xs font-medium text-primary">
          {formatAmountCurrency(itemsSubtotal, currencyCode)}
        </span>
        {extrasTotal !== 0 && (
          <span className="text-[10px] font-medium text-orange-500">
            {extrasTotal > 0 ? "+" : ""}
            {formatAmountCurrency(extrasTotal, currencyCode)}
          </span>
        )}
      </div>
    </div>
  );
};
