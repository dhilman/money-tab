import { type InputHTMLAttributes, useRef } from "react";
import { cn } from "~/lib/utils";

interface Props {
  className?: string;
  value: string;
  placeholder?: string;
  entryKeyHint?: InputHTMLAttributes<HTMLInputElement>["enterKeyHint"];
  onChange: (value: string) => void;
}

export const TextInput = ({
  className,
  value,
  placeholder,
  entryKeyHint,
  onChange,
}: Props) => {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <input
      ref={ref}
      type="text"
      inputMode="text"
      value={value}
      placeholder={placeholder}
      className={cn(
        "w-full resize-none font-medium focus:outline-none",
        className
      )}
      enterKeyHint={entryKeyHint}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          ref.current?.blur();
        }
      }}
    />
  );
};

interface SecondaryProps {
  className?: string;
  placeholder?: string;
  value: string;
  autoFocus?: boolean;
  onValueChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const TextInputSecondary = ({
  className,
  placeholder,
  value,
  autoFocus,
  onValueChange,
  onKeyDown,
}: SecondaryProps) => {
  return (
    <input
      autoFocus={autoFocus}
      type="text"
      inputMode="text"
      value={value}
      placeholder={placeholder}
      className={cn(
        "h-9 w-full rounded-md bg-canvas px-2 py-1 focus:outline-none",
        "text-sm font-medium",
        className
      )}
      onChange={(e) => onValueChange(e.target.value)}
      onKeyDown={onKeyDown}
    />
  );
};
