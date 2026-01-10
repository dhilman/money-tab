import { useTranslation } from "react-i18next";
import {
  Tabs,
  TabsContent,
  TabsListPrimitive,
  TabsTriggerPrimitive,
} from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

interface BottomTabsProps {
  txs: React.ReactNode;
  subs: React.ReactNode;
}

export const BottomTabs = ({ txs, subs }: BottomTabsProps) => {
  const { t } = useTranslation();
  return (
    <Tabs
      defaultValue="txs"
      className="flex h-full w-full flex-col bg-background pb-4"
    >
      <TabsListPrimitive
        className={cn(
          "flex w-full items-center justify-center gap-4 border-b border-hint/10 text-hint",
        )}
      >
        <Trigger value="txs">{t("expenses")}</Trigger>
        <Trigger value="subs">{t("subscriptions")}</Trigger>
      </TabsListPrimitive>
      <TabsContent value="txs" className="w-full bg-background pt-2">
        {txs}
      </TabsContent>
      <TabsContent value="subs" className="w-full bg-background">
        {subs}
      </TabsContent>
    </Tabs>
  );
};

interface TriggerProps {
  value: string;
  children: React.ReactNode;
}

const Trigger = ({ value, children }: TriggerProps) => {
  return (
    <TabsTriggerPrimitive
      value={value}
      className={cn(
        "group h-12 w-36 text-center text-sm font-semibold",
        "data-[state=active]:text-foreground",
      )}
    >
      <div className="relative mx-auto flex h-12 w-fit items-center">
        <div className="absolute inset-x-0 bottom-0 hidden h-1 rounded-t-lg bg-link group-data-[state=active]:block" />
        {children}
      </div>
    </TabsTriggerPrimitive>
  );
};
