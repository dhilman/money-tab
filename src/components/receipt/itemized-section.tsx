"use client";

import { ReceiptIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { useTxEditCtx } from "~/components/pages/tx/form/tx-form-ctx";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Separator } from "~/components/ui/list";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import { ReceiptExtrasSection } from "./receipt-extras-section";
import { ReceiptItemList } from "./receipt-item-list";
import { ReceiptScanInput } from "./receipt-scan-input";
import { ReceiptValidationBar } from "./receipt-validation-bar";
import { useReceiptCtx } from "./receipt-context";

/**
 * Inline expandable section rendered below the participant rows when split mode
 * is "itemized". Holds the item assignment list, extras, and validation, and
 * pushes computed per-person totals into the participants reducer.
 */
export const ItemizedSection = () => {
  const { t } = useTranslation();
  const { receipt, assignments, personTotals, setSplitEnabled } =
    useReceiptCtx();
  const participants = useParticipantsCtx();
  const { parties } = participants;
  const txEdit = useTxEditCtx();

  const hasItems = (receipt?.items.length ?? 0) > 0;
  const personTotalsSum = useMemo(
    () => personTotals.reduce((acc, pt) => acc + pt.total, 0),
    [personTotals],
  );

  // Receipt context's `splitEnabled` flag gates personTotals computation; ensure
  // it's on when itemized mode is active so the bridge effect below has data.
  useEffect(() => {
    setSplitEnabled(true);
  }, [setSplitEnabled]);

  // Live bridge: keep the form amount, per-party amount bucket, and per-party
  // itemized bucket all aligned with the computed personTotals. Users not in
  // personTotals get explicit zeros. Form amount is locked to the personTotals
  // sum so submission always sees a balanced split (the validation bar handles
  // any drift from `receipt.total` separately).
  useEffect(() => {
    if (!hasItems || personTotalsSum === 0) return;
    if (txEdit.amount !== personTotalsSum) {
      txEdit.setAmount(personTotalsSum);
    }
    const totalsByUser = new Map(personTotals.map((pt) => [pt.userId, pt.total]));
    for (const party of parties) {
      const target = totalsByUser.get(party.id) ?? 0;
      if (party.splitItemized.value === target) continue;
      participants.setSplitValue(party.id, target, "amount");
      participants.setSplitValue(party.id, target, "itemized");
    }
    // setSplitValue / setAmount identities change per render; depend on data only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personTotals, personTotalsSum, parties, hasItems]);

  if (!hasItems) {
    return (
      <>
        <Separator />
        <ReceiptScanInput />
      </>
    );
  }

  const assignedCount = assignments.filter((a) =>
    Object.values(a.shares).some((s) => s > 0),
  ).length;
  const totalCount = receipt?.items.length ?? 0;
  const currencyCode = receipt?.currencyCode ?? "USD";
  const total = receipt?.total ?? 0;

  return (
    <>
      <Separator />
      <Accordion type="single" collapsible defaultValue="items">
        <AccordionItem value="items">
          <AccordionTrigger className="rounded-xl px-4 py-3 hover:bg-canvas/30">
            <div className="flex items-center gap-3">
              <ReceiptIcon className="h-4 w-4 text-hint" />
              <span className="text-sm font-medium">
                {t("receipt.section_title", {
                  assigned: assignedCount,
                  total: totalCount,
                  amount: formatAmountCurrency(total, currencyCode),
                })}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 px-4 pb-4">
            <ReceiptItemList />
            <ReceiptExtrasSection />
            <ReceiptValidationBar />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
};

/** Caption for a participant in itemized mode (e.g. "2 items · share of extras"). */
export const useItemizedCaption = (userId: string) => {
  const { t } = useTranslation();
  const { assignments, extras, personTotals } = useReceiptCtx();

  return useMemo(() => {
    const items = assignments.filter(
      (a) => (a.shares[userId] ?? 0) > 0,
    ).length;
    const pt = personTotals.find((p) => p.userId === userId);
    const hasExtras = (pt?.extrasTotal ?? 0) !== 0 && extras.length > 0;

    if (items === 0 && !hasExtras) {
      return t("receipt.not_assigned");
    }
    return t("receipt.item_count_with_extras", {
      count: items,
      extras: hasExtras ? t("receipt.plus_extras") : "",
    }).trim();
  }, [assignments, extras, personTotals, userId, t]);
};
