import { PlusIcon, XIcon } from "lucide-react";
import { getDateLocal } from "~/lib/dates/format-dates";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const DateInput = ({ value, onChange }: DateInputProps) => {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="ml-auto h-9 w-40 rounded-md bg-canvas px-4 text-sm font-medium"
    />
  );
};

interface DateInputOptionalProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export const DateInputOptional = ({
  value,
  onChange,
}: DateInputOptionalProps) => {
  if (value) {
    return (
      <div className="ml-auto flex h-9 w-40 items-center gap-1 rounded-md bg-canvas">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-32 rounded-md py-1 pl-4 text-sm font-medium"
        />
        <button
          onClick={() => onChange(null)}
          className="inline-flex shrink-0 items-center justify-center rounded-r-md border-l border-hint/10 p-2"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        // set to 1 month from now
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        onChange(getDateLocal(date));
      }}
      className="ml-auto flex h-10 w-10 items-center justify-center text-primary"
    >
      <PlusIcon className="h-4 w-4" />
    </button>
  );
};
