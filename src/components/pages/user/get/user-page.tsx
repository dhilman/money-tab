import { SendIcon, UserPlus2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { BottomTabs } from "~/components/common/bottom-tabs";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { SubListStatefull } from "~/components/pages/sub/list/sub-list";
import { TxListStatefull } from "~/components/pages/tx/list/tx-list";
import { UserBalance } from "~/components/pages/user/get/user-balance";
import { UserDropdown } from "~/components/pages/user/get/user-dropdown";
import { UserHeader } from "~/components/pages/user/get/user-header";
import { useUserCtx } from "~/components/pages/user/get/user-provider";
import {
  useProfile,
  useShareProfile,
} from "~/components/provider/auth/auth-provider";
import { MoreButton, NewSubButton, NewTxButton } from "~/components/ui/buttons";
import { ButtonV1 } from "~/components/ui/buttonv1";
import { IconV1 } from "~/components/ui/iconv1";
import { cn } from "~/lib/utils";

export function UserPage() {
  return (
    <WebAppMain className="min-h-full pb-0">
      <UserPageContent />
    </WebAppMain>
  );
}

function UserPageContent() {
  const { isSelf } = useUserCtx();

  if (isSelf) {
    return (
      <div className="flex w-full flex-col items-center gap-6">
        <UserHeader />
        <div className="h-2" />
        <ShareSelf />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center gap-6">
      <UserHeader />
      <ActionButtons />
      <UserBalance />
      <div />
      <UserTabs />
    </div>
  );
}

const UserTabs = () => {
  const { txs, subs, isLoading, user, isContact, isLoadingTxs } = useUserCtx();

  return (
    <BottomTabs
      txs={
        <TxListStatefull
          isLoading={isLoadingTxs}
          txs={txs}
          source={{ userId: user.id }}
          hideCreate={!isContact}
        />
      }
      subs={
        <SubListStatefull
          isLoading={isLoading}
          subs={subs}
          source={{ userId: user.id }}
          hideCreate={!isContact}
        />
      }
    />
  );
};

const ShareSelf = () => {
  const { t } = useTranslation();
  const shareProfile = useShareProfile();
  return (
    <Bento>
      <BentoContent
        className={cn("relative z-10 h-40 overflow-hidden rounded-2xl p-0.5")}
      >
        <div className="absolute inset-0 h-full w-full animate-rotate rounded-full bg-[conic-gradient(#0ea5e9_20deg,transparent_120deg)]"></div>
        <div
          className="relative flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl bg-background px-4"
          onClick={shareProfile}
        >
          <SendIcon className="h-7 w-7 text-primary" />
          <div className="space-y-1 text-center">
            <div>{t("share_your_profile_with_others")}</div>
            <div className="text-sm text-hint">
              {t("others_will_be_able_to_connect")}
            </div>
          </div>
        </div>
      </BentoContent>
    </Bento>
  );
};

const ActionButtons = () => {
  const { user, isLoading, isContact } = useUserCtx();

  if (isLoading) {
    return (
      <div className="flex w-full justify-center px-2">
        <div className="h-12 w-full animate-pulse rounded-xl bg-background/50" />
      </div>
    );
  }

  if (!isContact) return <AddContact />;

  return (
    <Bento>
      <div className="grid w-full grid-cols-3 gap-2">
        <NewSubButton
          route={{
            pathname: "/webapp/sub/create",
            query: { userId: user.id },
          }}
        />
        <NewTxButton
          route={{
            pathname: "/webapp/tx/create",
            query: { userId: user.id },
          }}
        />
        <UserDropdown>
          <MoreButton />
        </UserDropdown>
      </div>
    </Bento>
  );
};

const AddContact = () => {
  const { t } = useTranslation();
  const { register } = useProfile();
  const { user, connectMutation } = useUserCtx();

  return (
    <Bento>
      <ButtonV1
        variant="primary"
        className="w-full"
        onClick={async () => {
          await register();
          connectMutation.mutate(user.id);
        }}
        disabled={connectMutation.isPending}
      >
        <IconV1 Icon={UserPlus2Icon} />
        {t("add_contact")}
      </ButtonV1>
    </Bento>
  );
};
