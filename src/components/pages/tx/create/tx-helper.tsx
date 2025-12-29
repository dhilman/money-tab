import { MailIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

export const TxHelper = () => {
  const { transactions, user } = useProfile();
  const [dismissed, setDismissed] = useState(() => {
    // return false;
    if (transactions.length > 8) return true;
    if (transactions.some((tx) => tx.createdById === user.id)) return true;
    const dismissed = localStorage.getItem("tx-helper-dismissed");
    return dismissed === "true";
  });

  const handleDismiss = () => {
    localStorage.setItem("tx-helper-dismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <Drawer>
      <HelperDrawerTrigger onDismiss={handleDismiss} />
      <HelperDrawerContent />
    </Drawer>
  );
};

interface HelperDrawerTriggerProps {
  onDismiss: () => void;
}

const HelperDrawerTrigger = ({ onDismiss }: HelperDrawerTriggerProps) => {
  const { t } = useTranslation();
  return (
    <Bento>
      <BentoContent className="flex flex-col gap-2 rounded-xl px-4 py-3 shadow-sm">
        <div className="px-1 text-lg font-medium">
          {t("help_create_tx_how_txs_work")}
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <DrawerTrigger asChild>
            <Button
              variant="accent"
              size="sm"
              className="rounded-full text-sm font-semibold"
            >
              {t("learn_more")}
            </Button>
          </DrawerTrigger>
          <Button
            variant="hint"
            size="sm"
            onClick={onDismiss}
            className="rounded-full text-sm"
          >
            {t("dismiss")}
          </Button>
        </div>
      </BentoContent>
    </Bento>
  );
};

const HelperDrawerContent = () => {
  const { t } = useTranslation();
  return (
    <DrawerContent className="h-[calc(100vh-4rem)]">
      <div className="flex w-full justify-center overflow-y-auto">
        <div className="w-full max-w-xl pb-12">
          <DrawerHeader className="pt-2">
            <DrawerTitle>Creating an Expense</DrawerTitle>
            <DrawerDescription>
              An expense can be used to track personal spending or share costs
              with contacts.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex w-full flex-col items-center gap-3 p-2">
            <HelperStepCard>
              <HelperStepNumber>1</HelperStepNumber>
              <div>
                <h3 className="text-lg font-semibold">Add Participants</h3>
                <p className="text-sm text-hint">
                  {t("help_create_tx_select_payer_subtitle")}
                </p>
              </div>
            </HelperStepCard>
            <HelperStepCard>
              <HelperStepNumber>2</HelperStepNumber>
              <div>
                <h3 className="text-lg font-semibold">
                  {t("help_create_tx_enter_amount")}
                </h3>
                <p className="text-sm text-hint">
                  {t("help_create_tx_enter_amount_subtitle")}
                </p>
              </div>
            </HelperStepCard>
            <HelperStepCard className="mt-3">
              <HelperStepNumber>3</HelperStepNumber>
              <div>
                <h3 className="text-lg font-semibold">
                  {t("help_create_tx_add_participants")}
                </h3>
                <p className="text-sm text-hint">
                  {t("help_create_tx_add_participants_subtitle")}
                </p>
              </div>
            </HelperStepCard>
            <div className="text-lg font-semibold">{t("or")}</div>
            <HelperStepCard>
              <Icon
                Icon={MailIcon}
                size="2xl"
                round
                variant="primary-gradient"
              />
              <div>
                <h3 className="text-lg font-semibold">
                  {t("help_create_tx_invite_participants_later")}
                </h3>
                <p className="text-sm text-hint">
                  {t("help_create_tx_invite_participants_later_subtitle")}
                </p>
              </div>
            </HelperStepCard>
          </div>
        </div>
      </div>
    </DrawerContent>
  );
};

interface HelperStepCardProps {
  className?: string;
  children: React.ReactNode;
}

const HelperStepCard = ({ className, children }: HelperStepCardProps) => {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-3.5 rounded-2xl border border-hint/20 p-3",
        className
      )}
    >
      {children}
    </div>
  );
};

const HelperStepNumber = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
        "bg-primary text-xl font-semibold text-primary-foreground"
      )}
    >
      {children}
    </div>
  );
};
