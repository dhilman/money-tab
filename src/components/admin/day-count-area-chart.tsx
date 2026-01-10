import dayjs from "dayjs";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DataPoint {
  key: Date;
  count: number;
}

interface Props {
  data: DataPoint[];
}

export const DayCountAreaChart = ({ data }: Props) => {
  return (
    <ResponsiveContainer width="100%" height={400} className="-ml-4">
      <AreaChart data={data}>
        <XAxis
          dataKey="key"
          tickFormatter={(date: Date) => dayjs(date).format("D/MM")}
          className="text-xs! text-foreground!"
        />
        <YAxis dataKey="count" className="text-xs! text-foreground!" />
        <Area
          dataKey="count"
          className="fill-primary/30! stroke-primary!"
          fill="var(--color-primary)"
          stroke="var(--color-primary)"
          type="monotone"
        />
        <Tooltip
          labelFormatter={(date: Date) => dayjs(date).format("D MMM YYYY")}
          wrapperClassName="bg-background! border! border-hint/30! rounded-md!"
          labelClassName="text-foreground!"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
