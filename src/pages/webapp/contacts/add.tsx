import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { useShareProfile } from "~/components/provider/auth/auth-provider";
import { usePlatform } from "~/components/provider/platform/context";
import { webAppPage } from "~/components/provider/webapp-provider";
import { MyLink } from "~/components/router/link";
import {
  AnimationPlayer,
  useImportAnimationPlayer,
} from "~/components/ui/animation";
import { URLS } from "~/lib/consts/urls";

export default webAppPage(Page);
function Page() {
  useImportAnimationPlayer();
  const { t } = useTranslation();
  const shareProfile = useShareProfile();
  const platform = usePlatform();

  return (
    <WebAppMain className="min-h-full pt-4">
      <Bento className="grid min-h-full grid-rows-3 gap-2">
        <BentoContent
          as="button"
          onClick={shareProfile}
          className="flex h-full flex-col items-center justify-center p-4"
        >
          <AnimationPlayer
            name="duck-send"
            style={{ width: "100px", height: "100px" }}
          />
          <div className="mt-4 text-base font-semibold">
            {t("share_an_invite_link")}
          </div>
        </BentoContent>
        <BentoContent
          as="button"
          onClick={() => platform.openTgLink(URLS.BOT_URL_GROUP)}
          className="flex h-full flex-col items-center justify-center p-4"
        >
          <AnimationPlayer
            name="duck-count"
            style={{ width: "100px", height: "100px" }}
          />
          <div className="mt-4 text-base font-semibold">
            {t("add_moneytab_to_telegram_group")}
          </div>
        </BentoContent>
        <BentoContent
          as={MyLink}
          route={{ pathname: "/webapp/group/create" }}
          className="flex h-full flex-col items-center justify-center p-4"
        >
          <AnimationPlayer
            name="duck-colors"
            style={{ width: "100px", height: "100px" }}
          />
          <div className="mt-4 text-base font-semibold">
            {t("create_a_new_group")}
          </div>
        </BentoContent>
      </Bento>
    </WebAppMain>
  );
}
