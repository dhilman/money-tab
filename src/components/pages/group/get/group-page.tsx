import { PlusIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
import { BottomTabs } from "~/components/common/bottom-tabs";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { GroupDropdown } from "~/components/pages/group/get/group-dropdown";
import { GroupMembers } from "~/components/pages/group/get/group-members";
import { useGroupCtx } from "~/components/pages/group/get/group-provider";
import { GroupAvatar } from "~/components/pages/group/group-avatar";
import { SubListStatefull } from "~/components/pages/sub/list/sub-list";
import { TxListStatefull } from "~/components/pages/tx/list/tx-list";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { LoadingProvider } from "~/components/provider/states-provider";
import { MoreButton, NewSubButton, NewTxButton } from "~/components/ui/buttons";
import { ButtonV1 } from "~/components/ui/buttonv1";
import { IconV1 } from "~/components/ui/iconv1";
import { api } from "~/utils/api";

export const GroupPage = () => {
  return (
    <WebAppMain className="flex min-h-full flex-col items-center gap-6 pb-0">
      <Header />
      <ActionButtons />
      <GroupMembers />
      <div />
      <GroupTabs />
    </WebAppMain>
  );
};

const Header = () => {
  const { t } = useTranslation();
  const { group, isLoading } = useGroupCtx();
  return (
    <div className="flex w-full flex-col items-center text-center">
      <GroupAvatar group={group} size="4xl" />
      <LoadingProvider
        isLoading={isLoading}
        loading={
          <>
            <div className="mt-3 h-8 w-32 animate-pulse rounded-full bg-background/50" />
            <div className="mt-0.5 h-6 w-20 animate-pulse rounded-md bg-background/30" />
          </>
        }
      >
        <div className="mt-3 text-2xl font-semibold">{group.name}</div>
        <div className="mt-0.5 font-medium lowercase text-hint">
          {t("n_members", { count: group.memberships.length })}
        </div>
      </LoadingProvider>
    </div>
  );
};

const ActionButtons = () => {
  const { group, isLoading } = useGroupCtx();
  const { t } = useTranslation();
  const { register } = useProfile();
  const ctx = api.useUtils();

  const join = api.group.join.useMutation({
    onSuccess: () => {
      toast.success(t("joined_group"));
      void ctx.group.get.invalidate();
      void ctx.user.get.invalidate();
    },
    onError: () => {
      toast.error(t("error.generic"));
    },
  });

  if (isLoading) {
    return (
      <div className="flex w-full justify-center px-2">
        <div className="h-12 w-full animate-pulse rounded-lg bg-background/50" />
      </div>
    );
  }

  if (!group.isMember) {
    return (
      <div className="flex w-full justify-center px-2">
        <ButtonV1
          variant="primary"
          onClick={async () => {
            await register();
            join.mutate(group.id);
          }}
          disabled={join.isPending}
          className="w-2/3"
        >
          <IconV1 Icon={PlusIcon} />
          {t("join_group")}
        </ButtonV1>
      </div>
    );
  }

  return (
    <Bento>
      <div className="flex w-full gap-2">
        <NewSubButton
          route={{
            pathname: "/webapp/sub/create",
            query: { groupId: group.id },
          }}
        />
        <NewTxButton
          route={{
            pathname: "/webapp/tx/create",
            query: { groupId: group.id },
          }}
        />
        <GroupDropdown>
          <MoreButton />
        </GroupDropdown>
      </div>
    </Bento>
  );
};

const GroupTabs = () => {
  const { group, subs, isLoading } = useGroupCtx();
  const { data, isLoading: isLoadingTxs } = api.tx.listWithGroup.useQuery(
    { groupId: group.id },
    {
      enabled: group.isMember,
    }
  );

  const txs = data?.txs ?? [];

  if (!group.isMember) return null;

  return (
    <BottomTabs
      txs={
        <TxListStatefull
          isLoading={isLoadingTxs}
          txs={txs}
          source={{ groupId: group.id }}
          hideCreate={!group.isMember}
        />
      }
      subs={
        <SubListStatefull
          isLoading={isLoading}
          subs={subs}
          source={{ groupId: group.id }}
          hideCreate={!group.isMember}
        />
      }
    />
  );
};
