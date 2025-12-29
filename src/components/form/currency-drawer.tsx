import { useState } from "react";
import { CurrencySelect } from "~/components/form/currency-select";
import { ButtonV1 } from "~/components/ui/buttonv1";
import { Drawer, DrawerContent, DrawerTrigger } from "~/components/ui/drawer";
import type { Currency } from "~/lib/amount/currencies";

interface OptionGroup {
  label: string;
  options: Currency[];
}

interface Props {
  value: Currency;
  options: OptionGroup[];
  onChange: (currency: Currency) => void;
}

export const CurrencySelectDrawer = ({ value, options, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <ButtonV1
          variant="tertiary"
          size="picker"
          className="w-fit"
          onClick={() => setOpen(true)}
        >
          {value.code}
        </ButtonV1>
      </DrawerTrigger>
      <DrawerContent className="h-[calc(100vh-4rem)]">
        <div className="flex w-full justify-center overflow-auto">
          <CurrencySelect
            options={options}
            onSelect={(v) => {
              onChange(v);
              setOpen(false);
            }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
