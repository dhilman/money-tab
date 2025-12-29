import { useTranslation } from "react-i18next";
import { Bento, BentoHeader } from "~/components/bento-box";
import { useGroupCtx } from "~/components/pages/group/get/group-provider";
import {
  UserWithBalance,
  UserWithBalanceLoadingList,
} from "~/components/pages/user/user-with-balance";
import { usePlatform } from "~/components/provider/platform/context";
import { LoadingProvider } from "~/components/provider/states-provider";
import { Button } from "~/components/ui/button";
import { List } from "~/components/ui/list";
import i18n from "~/lib/i18n";
import { getTgWebAppShareUrl } from "~/lib/url/share-url";

export const GroupMembers = () => {
  const { group, isLoading } = useGroupCtx();

  console.log("memberships", group.memberships.length);

  return (
    <Bento>
      <Header />
      <LoadingProvider
        isLoading={isLoading}
        loading={<UserWithBalanceLoadingList />}
      >
        <List>
          {group.memberships.map((membership) => (
            <UserWithBalance
              key={membership.userId}
              userId={membership.userId}
            />
          ))}
        </List>
      </LoadingProvider>
    </Bento>
  );
};

const Header = () => {
  const { t } = useTranslation();
  const { group } = useGroupCtx();
  const platform = usePlatform();
  return (
    <BentoHeader>
      <div>{t("members")}</div>
      {group.isMember && (
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto w-fit"
          onClick={() => {
            const url = getTgWebAppShareUrl(
              { type: "GROUP", id: group.id },
              i18n.t("share_message_group")
            );
            platform.openTgLink(url);
          }}
        >
          {t("invite_others")}
        </Button>
      )}
    </BentoHeader>
  );
};
