import { useMemo, useState } from "react";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { Button } from "~/components/ui/button";

interface DataItem {
  key: string | null; // formerly 'country'
  count: number; // formerly 'count'
}

interface Props {
  items: DataItem[];
  labelFormatter?: (label: string) => React.ReactElement;
  header: string;
}

export const BentoCounts = ({ items, labelFormatter, header }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const entries = useMemo(() => {
    const max = items.reduce((acc, { count }) => Math.max(acc, count), 0);
    return items
      .map(({ key, count }) => {
        const width = (count / max) * 100;
        return { key: key ?? "unknown", count, width };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, expanded ? items.length : 5);
  }, [items, expanded]);

  function Label({ label }: { label: string }) {
    if (labelFormatter) {
      return labelFormatter(label);
    }
    return <div>{label}</div>;
  }

  return (
    <Bento>
      <BentoHeader>{header}</BentoHeader>
      <BentoContent className="p-2">
        <div className="flex w-full flex-col gap-1">
          {entries.map(({ key, count: value, width }) => (
            <div
              key={key}
              className="relative flex w-full items-center justify-between p-2 text-sm"
            >
              <div
                className="absolute left-0 top-0 h-full rounded-lg bg-hint/10"
                style={{ width: `${width}%` }}
              />
              <Label label={key} />
              <div>{value}</div>
            </div>
          ))}
        </div>
        {items.length > 5 && (
          <Button
            className="mt-2"
            onClick={() => setExpanded((exp) => !exp)}
            variant="secondary"
            size="sm"
          >
            {expanded ? "Show less" : "Show more"}
          </Button>
        )}
      </BentoContent>
    </Bento>
  );
};
