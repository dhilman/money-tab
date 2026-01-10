import { RepeatIcon } from "lucide-react";
import { CurrencyAmount } from "~/components/amount";
import { useSubCtx } from "~/components/pages/sub/get/sub-provider";
import { SubFrequency } from "~/components/pages/sub/sub-freq";
import {
  LoadingProvider,
  LoadingText,
} from "~/components/provider/states-provider";
import { cn } from "~/lib/utils";

export const SubHeader = () => {
  const { sub, isLoading } = useSubCtx();

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="mb-1 px-4 text-center font-rounded text-xl font-semibold">
        <LoadingProvider
          isLoading={isLoading}
          loading={<LoadingText text="Loading..." />}
        >
          {sub.name}
        </LoadingProvider>
      </div>
      <CurrencyAmount
        size="5xl"
        className="leading-none font-bold"
        amount={sub.amount}
        currency={sub.currencyCode}
        isLoading={isLoading}
      />
      <div
        className={cn(
          "mt-2 flex items-center gap-1.5 px-3 py-1",
          "rounded-full text-sm font-semibold shadow-sm",
          "bg-foreground text-background",
          isLoading && "bg-hint/10 text-transparent",
        )}
      >
        <RepeatIcon className="h-3.5 w-3.5 stroke-[2.5px]" />
        <SubFrequency unit={sub.cycleUnit} value={sub.cycleValue} />
      </div>
    </div>
  );
};
