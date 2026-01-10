import { useTranslation } from "react-i18next";
import { CurrencyAmount } from "~/components/amount";
import { GroupAvatar } from "~/components/pages/group/group-avatar";
import { useTx } from "~/components/pages/tx/get/tx-provider";
import { useProfile } from "~/components/provider/auth/auth-provider";
import {
  LoadingProvider,
  LoadingText,
} from "~/components/provider/states-provider";
import { MyLink } from "~/components/router/link";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { cn } from "~/lib/utils";

export const TxHeader = () => {
  const { t } = useTranslation();
  const { tx, isLoading } = useTx();
  const isSettle = tx.type === "SETTLE";
  const desc = isSettle ? t("settlement") : tx.description;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="text-lg text-hint/80">{t("expense")}</div>
      <div className="mt-2 text-foreground">
        <CurrencyAmount
          size="5xl"
          className="font-bold"
          amount={tx.amount}
          currency={tx.currencyCode}
          isLoading={isLoading && !tx.amount}
        />
      </div>
      <div
        className={cn(
          "mt-1.5 px-4 text-center font-rounded text-xl font-semibold",
          desc || "text-hint",
        )}
      >
        <LoadingProvider
          isLoading={isLoading && !tx.amount}
          loading={<LoadingText text="Description" />}
        >
          {desc || t("no_desc")}
        </LoadingProvider>
      </div>
    </div>
  );
};

const TxHeaderGroup = () => {
  const { t } = useTranslation();
  const { tx } = useTx();
  const { groups } = useProfile();

  if (!tx.groupId) return null;

  const group = groups.find((g) => g.id === tx.groupId);
  if (!group) return null;

  return (
    <div className="flex w-full items-center justify-between border-t border-hint/10 px-3 py-2">
      <div>{t("group")}</div>
      <MyLink
        route={{ pathname: "/webapp/group/[id]", query: { id: group.id } }}
        className="inline-flex items-center gap-1.5 font-medium"
      >
        <div>{group.name}</div>
        <GroupAvatar group={group} size="xs" />
      </MyLink>
    </div>
  );
};

const Attachements = () => {
  const { t } = useTranslation();
  const { tx } = useTx();

  if (tx.files.length === 0) return null;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div className="flex w-full items-center justify-between border-t border-hint/10 px-3 py-2">
          <div>{t("attachments")}</div>
          <div className="flex w-full items-center justify-end gap-2">
            {tx.files.map((f) => (
              <img
                key={f.id}
                src={f.url}
                alt="attachment"
                className="h-6 w-6 rounded-md object-contain"
              />
            ))}
          </div>
        </div>
      </DrawerTrigger>
      <DrawerContent className="h-[calc(100vh-4rem)]">
        <div className="flex w-full justify-center overflow-y-auto bg-background">
          <div className="min-h-screen w-full max-w-xl pb-12">
            <DrawerHeader className="pt-2">
              <DrawerTitle>{t("attachments")}</DrawerTitle>
            </DrawerHeader>
            <div className="flex w-full flex-col items-center justify-center gap-2 p-4">
              {tx.files.map((f) => (
                <img
                  key={f.id}
                  src={f.url}
                  alt="attachment"
                  className="h-fit w-full rounded-md bg-canvas/10 object-contain"
                />
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
