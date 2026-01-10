import dayjs from "dayjs";
import { cn } from "~/lib/utils";

type AnyDate = Date | string | number;

export function adminFormatDate(d: AnyDate) {
  return dayjs(d, { utc: true }).format("D MMM YYYY HH:mm");
}

export type AdminTableValue = {
  key: string;
  value: React.ReactNode;
};

interface TableProps {
  values: AdminTableValue[];
}

export const AdminTable = ({ values }: TableProps) => {
  return (
    <div className="flex w-full flex-col">
      {values.map((v, i) => (
        <div
          key={v.key}
          className={cn(
            "grid w-full grid-cols-3 gap-2 p-2",
            i % 2 === 0 ? "bg-canvas/50" : "bg-canvas/10",
          )}
        >
          <div className="self-center text-sm font-semibold">{v.key}</div>
          <div className="col-span-2 flex w-full justify-end self-center text-right text-sm select-text">
            {v.value}
          </div>
        </div>
      ))}
    </div>
  );
};
