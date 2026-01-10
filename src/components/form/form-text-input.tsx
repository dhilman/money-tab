import { useRef, useState } from "react";
import { ListItem, ListItemBody } from "~/components/ui/list-item";
import { cn } from "~/lib/utils";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const FormTextInput = ({ id, label, value, onChange }: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const isInputShown = isFocused || value;
  return (
    <ListItem>
      <ListItemBody className="max-h-full py-0">
        <div className="flex w-full flex-col">
          <label
            htmlFor={id}
            className={cn(
              "text-hint block w-full text-sm transition-transform duration-300",
              !isInputShown && "translate-y-[11px] text-base",
            )}
          >
            {label}
          </label>
          <input
            ref={ref}
            id={id}
            type="text"
            className={cn(
              "w-full text-base text-transparent focus-visible:outline-hidden",
              isInputShown && "text-foreground",
            )}
            value={value}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                ref.current?.blur();
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </ListItemBody>
    </ListItem>
  );
};
