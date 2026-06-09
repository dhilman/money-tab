"use client";

import { useEffect, useRef, useState } from "react";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import { cn } from "~/lib/utils";

/**
 * Click-to-edit state machine. Owns the editing flag, draft string, input ref,
 * and Enter/Escape/blur handlers. Each field renders its own JSX; this hook
 * only handles the shared interaction plumbing.
 */
export function useClickToEdit(options: {
  format: () => string;
  commit: (draft: string) => void;
}) {
  const { format, commit } = options;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const start = () => {
    setDraft(format());
    setEditing(true);
  };

  const finish = () => {
    commit(draft);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") finish();
    else if (e.key === "Escape") cancel();
  };

  return { editing, draft, setDraft, start, finish, onKeyDown, ref };
}

type AmountVariant = "total" | "unit";

interface AmountFieldProps {
  value: number;
  currencyCode: string;
  currencySymbol: string;
  decimals: number;
  parse: (s: string) => number | null;
  onCommit: (v: number) => void;
  variant?: AmountVariant;
  /** Accept a leading minus sign and render negative values signed. */
  allowNegative?: boolean;
  /** Optional suffix shown after the formatted value (e.g. "each"). */
  suffix?: string;
}

const AMOUNT_STYLES: Record<AmountVariant, { text: string; input: string }> = {
  total: {
    text: "text-sm font-medium text-primary hover:underline",
    input: "w-20 text-sm font-medium text-primary",
  },
  unit: {
    text: "text-xs text-hint hover:text-secondary",
    input: "w-16 text-xs text-hint",
  },
};

export const AmountField = ({
  value,
  currencyCode,
  currencySymbol,
  decimals,
  parse,
  onCommit,
  variant = "total",
  allowNegative = false,
  suffix,
}: AmountFieldProps) => {
  const styles = AMOUNT_STYLES[variant];
  const edit = useClickToEdit({
    format: () => (value / 10 ** decimals).toFixed(decimals),
    commit: (draft) => {
      const trimmed = draft.trim();
      const negative = allowNegative && trimmed.startsWith("-");
      const parsed = parse(negative ? trimmed.slice(1) : trimmed);
      if (parsed !== null && parsed >= 0) onCommit(negative ? -parsed : parsed);
    },
  });

  if (edit.editing) {
    return (
      <div className="flex shrink-0 items-center gap-0.5">
        <span className="text-hint">{currencySymbol}</span>
        <input
          ref={edit.ref}
          type="text"
          inputMode="decimal"
          value={edit.draft}
          onChange={(e) => edit.setDraft(e.target.value)}
          onBlur={edit.finish}
          onKeyDown={edit.onKeyDown}
          className={cn(
            "border-b border-primary bg-transparent text-right outline-none",
            styles.input,
          )}
        />
        {suffix && <span className="ml-1 text-hint">{suffix}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={edit.start}
      className={cn("shrink-0", styles.text)}
    >
      {formatAmountCurrency(value, currencyCode, { withSign: allowNegative })}
      {suffix && <span className="ml-1">{suffix}</span>}
    </button>
  );
};
