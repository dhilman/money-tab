import { CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bento, BentoHeader } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { useProfile } from "~/components/provider/auth/auth-provider";

import { webAppPage } from "~/components/provider/webapp-provider";
import { useWebAppRouter } from "~/components/router/router";
import { List } from "~/components/ui/list";
import { ListItem, ListItemBody } from "~/components/ui/list-item";
import { changeLocale } from "~/lib/locale";

export const LANGUAGE_OPTS = [
  { value: "en" as const, label: "English", local: "English" },
  { value: "ru" as const, label: "Russian", local: "Русский" },
];

export default webAppPage(Page);
function Page() {
  const router = useWebAppRouter();
  const { t } = useTranslation();
  const { user, updateUser } = useProfile();

  const onLangSelect = (lang: (typeof LANGUAGE_OPTS)[number]) => {
    if (lang.value === user.languageCode) return;
    updateUser({ languageCode: lang.value });
    void changeLocale(lang.value);
    router.back();
  };

  return (
    <WebAppMain className="flex flex-col gap-6">
      <Bento>
        <BentoHeader>{t("language")}</BentoHeader>
        <List>
          {LANGUAGE_OPTS.map((lang) => (
            <ListItem
              key={lang.value}
              as="button"
              onClick={() => onLangSelect(lang)}
            >
              <ListItemBody>
                <div className="text-left">
                  <div>{lang.label}</div>
                  <div className="text-sm">{lang.local}</div>
                </div>
                {lang.value === user.languageCode && (
                  <CheckIcon className="ml-auto h-5 w-5 text-primary" />
                )}
              </ListItemBody>
            </ListItem>
          ))}
        </List>
      </Bento>
    </WebAppMain>
  );
}
