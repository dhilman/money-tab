import { useState } from "react";
import { NativeSelect } from "~/components/form/native-select";
import { ListItem, ListItemBody } from "~/components/ui/list-item";
import type { Cycle, CycleUnit } from "~/lib/consts/types";
import { cn } from "~/lib/utils";

interface Props {
  label: string;
  cycle: Cycle;
  onChange: (cycle: Cycle) => void;
  options: {
    value: CycleUnit;
    label: string;
  }[];
}

export const CustomCycleInput = ({
  label,
  cycle,
  onChange,
  options,
}: Props) => {
  const [text, setText] = useState(cycle.value.toString());
  const [isValid, setIsValid] = useState(cycle.value > 0);

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value);
    if (isNaN(num) || num <= 0) {
      setIsValid(false);
      onChange({ ...cycle, value: 0 });
    } else {
      setIsValid(true);
      onChange({ ...cycle, value: num });
    }
    setText(e.target.value);
  };

  return (
    <ListItem>
      <ListItemBody size="sm">
        <div>{label}</div>
        <input
          type="number"
          value={text}
          onChange={onTextChange}
          className={cn(
            "no-spinner ml-auto h-8 w-10 rounded-md bg-canvas text-center",
            !isValid && "bg-red-500/20"
          )}
          placeholder="0"
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
        <NativeSelect
          options={options}
          value={cycle.unit}
          onChange={(unit) => onChange({ ...cycle, unit })}
          className="ml-2 h-8 bg-canvas text-foreground"
        />
      </ListItemBody>
    </ListItem>
  );
};
