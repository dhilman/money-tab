import { XIcon } from "lucide-react";
import {
  ListItem,
  ListItemBody,
  ListItemIcon,
  ListItemLeft,
} from "~/components/ui/list-item";

interface AddDateButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

export const AddDateButton = ({ icon, label, onClick }: AddDateButtonProps) => {
  return (
    <ListItem as="button" onClick={onClick} className="text-primary">
      <ListItemLeft size="sm">
        <ListItemIcon icon={icon} />
      </ListItemLeft>
      <ListItemBody size="sm">{label}</ListItemBody>
    </ListItem>
  );
};

interface DateTimeInputProps {
  label: string;
  type: "date" | "time" | "datetime-local";
  value: string;
  setValue: (value: string) => void;
  autofocus?: boolean;
  removable?: boolean;
}

export const DateInputV1 = ({
  label,
  type,
  value,
  setValue,
  autofocus,
  removable,
}: DateTimeInputProps) => {
  return (
    <ListItem>
      <ListItemBody>
        <div>
          <div className="text-sm text-hint">{label}</div>
          <input
            type={type}
            className="rounded-md font-medium"
            autoFocus={autofocus}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        {removable && <RemoveButton onClick={() => setValue("")} />}
      </ListItemBody>
    </ListItem>
  );
};

interface DateInputRowProps {
  label: string;
  type: "date" | "time" | "datetime-local";
  value: string;
  setValue: (value: string) => void;
  autofocus?: boolean;
}

export const DateInputRow = ({
  label,
  type,
  value,
  setValue,
  autofocus,
}: DateInputRowProps) => {
  return (
    <ListItem>
      <ListItemBody size="sm">
        <div>{label}</div>
        <input
          type={type}
          className="ml-auto rounded-md font-medium"
          autoFocus={autofocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </ListItemBody>
    </ListItem>
  );
};

interface RemoveButtonProps {
  onClick: () => void;
}

export const RemoveButton = ({ onClick }: RemoveButtonProps) => {
  return (
    <button
      className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center"
      onClick={onClick}
    >
      <div className="h-[22px] w-[22px] rounded-full bg-hint/20 stroke-[3px] p-1 text-white">
        <XIcon className="h-full w-full text-hint" />
      </div>
    </button>
  );
};
