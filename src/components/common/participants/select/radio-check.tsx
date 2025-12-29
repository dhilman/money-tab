import { CheckIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface Props {
  as?: "div" | "button";
  className?: string;
  selected: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const RadioCheck = ({
  as,
  className,
  selected,
  disabled,
  onClick,
}: Props) => {
  const Component = as || "div";
  return (
    <Component
      className={cn(
        "flex h-[22px] w-[22px] shrink-0 items-center justify-center",
        "rounded-full border-[1.5px] text-primary-foreground",
        selected ? "border-primary bg-primary" : "border-hint/20",
        disabled && "border-hint bg-hint",
        className
      )}
      onClick={onClick}
    >
      {selected && <CheckIcon className="h-4 w-4" />}
    </Component>
  );
};
