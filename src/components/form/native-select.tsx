import type { ResourceKey } from "i18next";
import { ChevronsUpDownIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { MyResourceKey } from "~/@types/i18next";
import { cn } from "~/lib/utils";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  className?: string;
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export const NativeSelect = <T extends string>({
  className,
  options,
  value,
  onChange,
  placeholder,
  icon,
}: Props<T>) => {
  return (
    <NativeSelectContainer className={className}>
      <NativeSelectTrigger
        options={options}
        value={value}
        onChange={onChange}
      />
      {icon ?? <NativeSelectChevron />}
      <NativeSelectLabel
        options={options}
        value={value}
        placeholder={placeholder}
      />
    </NativeSelectContainer>
  );
};

interface NativeSelectContainerProps {
  className?: string;
  children: React.ReactNode;
}

export const NativeSelectContainer = ({
  className,
  children,
}: NativeSelectContainerProps) => {
  return (
    <div
      className={cn(
        "grid h-9 w-fit bg-transparent",
        "rounded-md border-0 border-transparent",
        "text-center text-base text-hint",
        className
      )}
    >
      {children}
    </div>
  );
};

interface NativeSelectChevronProps {
  className?: string;
}

export const NativeSelectChevron = ({
  className,
}: NativeSelectChevronProps) => {
  return (
    <ChevronsUpDownIcon
      className={cn(
        "relative right-1 z-10 col-start-1 row-start-1 h-4 w-4 self-center justify-self-end",
        "forced-colors:hidden pointer-events-none",
        "translate-x-1 translate-y-[0.5px] transform",
        className
      )}
    />
  );
};

interface NativeSelectSelectProps<T extends string> {
  className?: string;
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * This element will be hidden, and label should be used instead
 * In safari if select is not fontWeight: normal, serif font is used
 */
export const NativeSelectTrigger = <T extends string>({
  className,
  options,
  value,
  onChange,
}: NativeSelectSelectProps<T>) => {
  return (
    <select
      className={cn(
        "z-10 col-start-1 row-start-1 w-full appearance-none",
        "rounded-md bg-transparent font-normal text-transparent",
        className
      )}
      style={{ textAlign: "inherit" }}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          style={{ fontWeight: "normal" }}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface NativeSelectLabelProps {
  className?: string;
  options: readonly { value: string; label: string }[];
  value: string;
  placeholder?: string;
}

export const NativeSelectLabel = ({
  className,
  options,
  value,
  placeholder,
}: NativeSelectLabelProps) => {
  const showPlaceholder = !value && placeholder;
  return (
    <label
      className={cn(
        "col-start-1 row-start-1 flex h-full w-full items-center truncate",
        "place-content-end text-center",
        "pl-2 pr-6",
        className
      )}
    >
      <span className="truncate">
        {showPlaceholder
          ? placeholder
          : options.find((o) => o.value === value)?.label}
      </span>
    </label>
  );
};

interface SelectOptionI18N<T extends string> {
  label: MyResourceKey;
  value: T;
}

export function useTranslatedOptions<T extends string>(
  opts: readonly SelectOptionI18N<T>[]
) {
  const { t } = useTranslation();
  return useMemo(() => {
    return opts.map((opt) => ({
      label: t(opt.label as ResourceKey),
      value: opt.value,
    })) as SelectOption<T>[];
  }, [opts, t]);
}
