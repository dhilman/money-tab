import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";

interface HistogramBin {
  range: string;
  count: number;
}

interface Props<T extends string> {
  valueKey: T;
  data: {
    [key in T]: number | null;
  }[];
  bins: number[];
}

export const HistogramChart = <T extends string>({
  data,
  bins,
  valueKey,
}: Props<T>) => {
  const histogramData = useMemo(() => {
    // Create histogram bins based on the bin edges
    const histogramBins: HistogramBin[] = bins.map((bin, index) => {
      const nextBin = bins[index + 1];
      if (nextBin === undefined) return { range: `${bin}+`, count: 0 };
      return { range: `${bin}-${nextBin}`, count: 0 };
    });

    data.forEach((point) => {
      const v = point[valueKey];
      if (v === null || v === undefined) return;
      for (let i = 0; i < bins.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const bin = bins[i]!;
        const nextBin = bins[i + 1];
        if (nextBin === undefined) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          histogramBins[i]!.count++;
          break;
        } else if (v >= bin && v < nextBin) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          histogramBins[i]!.count++;
          break;
        }
      }
    });

    return histogramBins;
  }, [data, bins, valueKey]);

  return (
    <ResponsiveContainer width="100%" height={400} className="-ml-4">
      <BarChart data={histogramData} className="!text-foreground">
        <CartesianGrid strokeDasharray="3 3" className="stroke-hint/30" />
        <XAxis dataKey="range" className="!text-xs !text-foreground" />
        <YAxis className="!text-xs !text-foreground" />
        <Tooltip
          wrapperClassName="!bg-background !border !border-hint/30 !rounded-md !text-foreground"
          labelClassName="!text-foreground"
          itemStyle={{ color: "env(--foreground)" }}
        />
        <Bar dataKey="count" className="fill-primary/80">
          <LabelList
            dataKey="count"
            position="top"
            className="fill-foreground text-xs"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
