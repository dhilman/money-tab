"use client";

import { ReceiptIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { useTxEditCtxOptional } from "~/components/pages/tx/form/tx-form-ctx";
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
import { useReceiptCtxOptional } from "./receipt-context";

/**
 * Inline expandable section rendered below the participant rows when split mode
 * is "itemized". Holds the item assignment list, extras, and validation, and
 * pushes computed per-person totals into the participants reducer. Renders
 * nothing when no ReceiptProvider is mounted.
 */
export const ItemizedSection = () => {
  const { t } = useTranslation();
  const receiptCtx = useReceiptCtxOptional();
  const participants = useParticipantsCtx();
  const txEdit = useTxEditCtxOptional();

  const receipt = receiptCtx?.receipt ?? null;
  const personTotals = receiptCtx?.personTotals;
  const items = receipt?.items ?? [];
  const hasItems = items.length > 0;
  const personTotalsSum = useMemo(
    () => (personTotals ?? []).reduce((acc, pt) => acc + pt.total, 0),
    [personTotals],
  );

  // Live bridge: keep the form amount and the per-party itemized bucket aligned
  // with the computed personTotals. Users not in personTotals get explicit
  // zeros. Form amount is locked to the personTotals sum so submission always
  // sees a balanced split (the validation bar handles any drift from
  // `receipt.total` separately). A zero sum means nothing is assigned yet, so
  // the scanned total and seeded per-party values are left untouched.
  // Value-equality guards keep the syncs from looping.
  useEffect(() => {
    if (!personTotals || !hasItems || personTotalsSum === 0) return;
    if (txEdit && txEdit.amount !== personTotalsSum) {
      txEdit.setAmount(personTotalsSum);
    }
    const totalsByUser = new Map(
      personTotals.map((pt) => [pt.userId, pt.total]),
    );
    const totals = participants.parties.map((party) => ({
      id: party.id,
      amount: totalsByUser.get(party.id) ?? 0,
    }));
    const changed = participants.parties.some(
      (party) =>
        party.splitItemized.value !== (totalsByUser.get(party.id) ?? 0),
    );
    if (changed) {
      participants.applyItemizedTotals(totals);
    }
  }, [personTotals, personTotalsSum, participants, hasItems, txEdit]);

  if (!receiptCtx) return null;

  if (!hasItems) {
    return (
      <>
        <Separator />
        <ReceiptScanInput />
      </>
    );
  }

  const assignedCount = items.length - receiptCtx.unassignedItems.length;
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
                  total: items.length,
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

/**
 * Caption for a participant in itemized mode (e.g. "2 items · share of extras").
 * Returns null when no ReceiptProvider is mounted so callers can fall back.
 */
export const useItemizedCaption = (userId: string) => {
  const { t } = useTranslation();
  const receiptCtx = useReceiptCtxOptional();

  return useMemo(() => {
    if (!receiptCtx) return null;
    const { assignments, extras, personTotals } = receiptCtx;
    const items = assignments.filter((a) => (a.shares[userId] ?? 0) > 0).length;
    const pt = personTotals.find((p) => p.userId === userId);
    const hasExtras = (pt?.extrasTotal ?? 0) !== 0 && extras.length > 0;

    if (items === 0 && !hasExtras) {
      return t("receipt.not_assigned");
    }
    return t("receipt.item_count_with_extras", {
      count: items,
      extras: hasExtras ? t("receipt.plus_extras") : "",
    }).trim();
  }, [receiptCtx, userId, t]);
};
