import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "~/lib/utils";

interface DataPoint {
  id: string;
  start: Date;
  end: Date;
  total: number;
  ids: string[];
}

interface Props {
  data: DataPoint[];
  selected?: DataPoint | null;
  formatX: (v: Date) => string;
  formatY: (v: number) => string;
  onClick?: (v: DataPoint) => void;
}

/**
 * A bar chart to display total spend over time.
 * day format will use dayjs to format the x-axis as days of the week.
 * week format will use dayjs to format the x-axis as weeks of the month.
 * month format will use dayjs to format the x-axis as months of the year.
 */
export const SpendBarChart = ({
  data,
  selected,
  formatX,
  formatY,
  onClick,
}: Props) => {
  return (
    <ResponsiveContainer width="100%" height={300} className="-ml-4">
      <BarChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          className="stroke-hint/30!"
        />
        <XAxis
          dataKey="start"
          tickFormatter={formatX}
          className="text-foreground! text-xs!"
        />
        <YAxis
          dataKey="total"
          className="text-foreground! text-xs!"
          tickFormatter={formatY}
          strokeWidth={0}
        />
        <Bar dataKey="total" onClick={(data) => onClick?.(data as DataPoint)}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              className={cn(
                "fill-primary! z-10 stroke-transparent!",
                selected &&
                  (entry.id === selected.id
                    ? "fill-primary!"
                    : "fill-primary/30!"),
              )}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
