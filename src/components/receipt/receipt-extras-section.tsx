"use client";

import { MinusIcon, PlusIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import type { ExtraCharge, ExtrasAllocationMethod } from "~/lib/receipt";
import { SelectSimple } from "../ui/select-simple";
import { useReceiptCtx } from "./receipt-context";

type AllocationMethodType = ExtrasAllocationMethod["type"];

/**
 * Section showing extra charges (tax, tip, service, discount) with allocation method dropdowns.
 * Users can remove extras if they're already included in item prices (common with tax).
 */
export const ReceiptExtrasSection = () => {
  const { t } = useTranslation();
  const { receipt, extras, setExtraMethod, removeExtra } = useReceiptCtx();

  if (!extras.length) {
    return null;
  }

  const currencyCode = receipt?.currencyCode ?? "USD";

  const allocationOptions: {
    label: string;
    value: AllocationMethodType;
    labelLong: string;
  }[] = [
    {
      label: t("receipt.allocation.proportional"),
      value: "proportional_to_subtotal",
      labelLong: t("receipt.allocation.proportional_long"),
    },
    {
      label: t("receipt.allocation.even_involved"),
      value: "even_among_involved",
      labelLong: t("receipt.allocation.even_involved_long"),
    },
    {
      label: t("receipt.allocation.even_all"),
      value: "even_among_all",
      labelLong: t("receipt.allocation.even_all_long"),
    },
  ];

  const handleMethodChange = (
    extraId: string,
    methodType: AllocationMethodType,
  ) => {
    let method: ExtrasAllocationMethod;
    switch (methodType) {
      case "proportional_to_subtotal":
        method = { type: "proportional_to_subtotal" };
        break;
      case "even_among_involved":
        method = { type: "even_among_involved" };
        break;
      case "even_among_all":
        method = { type: "even_among_all" };
        break;
      case "custom":
        method = { type: "custom", shares: {} };
        break;
    }
    setExtraMethod(extraId, method);
  };

  return (
    <div className="space-y-2">
      <h3 className="px-1 text-sm font-medium text-hint">
        {t("receipt.extras")}
      </h3>
      <div className="space-y-2">
        {extras.map((extra) => (
          <ExtraChargeRow
            key={extra.id}
            extra={extra}
            currencyCode={currencyCode}
            options={allocationOptions}
            onMethodChange={(method) => handleMethodChange(extra.id, method)}
            onRemove={() => removeExtra(extra.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface ExtraChargeRowProps {
  extra: ExtraCharge;
  currencyCode: string;
  options: { label: string; value: AllocationMethodType; labelLong: string }[];
  onMethodChange: (method: AllocationMethodType) => void;
  onRemove: () => void;
}

const extraLabels = {
  tax: "receipt.extra.tax",
  tip: "receipt.extra.tip",
  service: "receipt.extra.service",
  discount: "receipt.extra.discount",
} as const;

const ExtraChargeRow = ({
  extra,
  currencyCode,
  options,
  onMethodChange,
  onRemove,
}: ExtraChargeRowProps) => {
  const { t } = useTranslation();
  const isDiscount = extra.amount < 0;

  const label = t(extraLabels[extra.id]);

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-hint/10 bg-background p-3">
      <div className="flex items-center gap-2">
        {isDiscount ? (
          <MinusIcon className="h-4 w-4 text-green-500" />
        ) : (
          <PlusIcon className="h-4 w-4 text-hint" />
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <SelectSimple
          value={extra.method.type}
          onChange={onMethodChange}
          options={options}
        />
        <span className="text-sm font-medium text-primary">
          {formatAmountCurrency(Math.abs(extra.amount), currencyCode)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 rounded-full p-1 text-hint hover:bg-hint/10 hover:text-secondary"
          aria-label={t("receipt.remove_extra")}
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
