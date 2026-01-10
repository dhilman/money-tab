import {
  BanknoteIcon,
  BookOpenIcon,
  ChevronRightIcon,
  EyeIcon,
  FileLockIcon,
  Globe2Icon,
  MessageCircleQuestionIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { SettingsWalletConnect } from "~/components/pages/settings/settings-wallet";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { usePlatform } from "~/components/provider/platform/context";
import { WalletProvider } from "~/components/provider/wallet-provider";
import { MyLink } from "~/components/router/link";
import {
  ListItem,
  ListItemBody,
  ListItemIcon,
  ListItemLeft,
} from "~/components/ui/list-item";
import { Switch } from "~/components/ui/switch";
import { URLS } from "~/lib/consts/urls";
import { LANGUAGE_OPTS } from "~/pages/webapp/settings/language";

export const Settings = () => {
  return (
    <WebAppMain className="flex flex-col gap-6 py-8">
      <SectionGeneral />
      <WalletProvider>
        <SettingsWalletConnect />
      </WalletProvider>
      <SectionInfo />
      <SectionAdmin />
    </WebAppMain>
  );
};

const SectionGeneral = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useProfile();
  const langValue = LANGUAGE_OPTS.find((l) => l.value === user.languageCode);

  return (
    <Bento>
      <BentoContent>
        <ListItem as={MyLink} route={{ pathname: "/webapp/settings/language" }}>
          <ListItemLeft>
            <ListItemIcon
              icon={Globe2Icon}
              size="lg"
              className="bg-primary text-primary-foreground"
            />
          </ListItemLeft>
          <ListItemBody size="sm">
            <div>{t("language")}</div>
            <div className="text-hint ml-auto flex items-center gap-2">
              {langValue?.label}
              <ChevronRightIcon className="h-4 w-4" />
            </div>
          </ListItemBody>
        </ListItem>
        <ListItem as={MyLink} route={{ pathname: "/webapp/settings/currency" }}>
          <ListItemLeft>
            <ListItemIcon
              icon={BanknoteIcon}
              size="lg"
              className="bg-green-500"
              iconClassName="stroke-white"
            />
          </ListItemLeft>
          <ListItemBody size="sm">
            <div>{t("default_currency")}</div>
            <div className="text-hint ml-auto flex items-center gap-2">
              {user.currencyCode || t("most_recent")}
              <ChevronRightIcon className="h-4 w-4" />
            </div>
          </ListItemBody>
        </ListItem>
        <ListItem>
          <ListItemLeft>
            <ListItemIcon
              icon={EyeIcon}
              size="lg"
              className="bg-black"
              iconClassName="stroke-white"
            />
          </ListItemLeft>
          <ListItemBody size="sm">
            <div>{t("show_balance")}</div>
            <Switch
              checked={!user.hideBalance}
              onCheckedChange={(v) => updateUser({ hideBalance: !v })}
              className="ml-auto"
            />
          </ListItemBody>
        </ListItem>
      </BentoContent>
    </Bento>
  );
};

const SectionInfo = () => {
  const { t } = useTranslation();
  const platform = usePlatform();
  return (
    <Bento>
      <BentoContent className="overflow-hidden">
        <ListItem
          as={MyLink}
          className="text-link"
          route={{ pathname: "/webapp/tour" }}
        >
          <ListItemLeft>
            <ListItemIcon icon={BookOpenIcon} />
          </ListItemLeft>
          <ListItemBody size="sm">{t("take_tour")}</ListItemBody>
        </ListItem>
        <ListItem
          as="button"
          className="text-link"
          onClick={() => platform.openTgLink(URLS.TG_SUPPORT)}
        >
          <ListItemLeft>
            <ListItemIcon icon={MessageCircleQuestionIcon} />
          </ListItemLeft>
          <ListItemBody size="sm">
            <div>{t("contact_support")}</div>
          </ListItemBody>
        </ListItem>
        <ListItem
          as="button"
          className="text-link"
          onClick={() => platform.openLink(URLS.PRIVACY)}
        >
          <ListItemLeft>
            <ListItemIcon icon={FileLockIcon} />
          </ListItemLeft>
          <ListItemBody size="sm">{t("privacy_policy")}</ListItemBody>
        </ListItem>
      </BentoContent>
    </Bento>
  );
};

const SectionAdmin = () => {
  const { user, isLoading } = useProfile();
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER";

  if (isLoading) return null;
  if (!isAdmin) return null;

  return (
    <Bento>
      <BentoHeader>
        <div>Admin</div>
      </BentoHeader>
      <BentoContent>
        <ListItem
          as={MyLink}
          route={{ pathname: "/admin/dashboard" }}
          className="text-link"
        >
          <ListItemBody size="sm">Dashboard</ListItemBody>
        </ListItem>
        {user.role === "SUPER" && (
          <ListItem
            as={MyLink}
            route={{ pathname: "/admin/users" }}
            className="text-link"
          >
            <ListItemBody size="sm">Users</ListItemBody>
          </ListItem>
        )}
      </BentoContent>
    </Bento>
  );
};
