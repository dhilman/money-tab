import { useTranslation } from "react-i18next";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { ContactsTabs } from "~/components/pages/contacts/contacts-tabs";
import { MainButton } from "~/components/provider/platform/context";
import { useWebAppRouter } from "~/components/router/router";

export const ContactsPage = () => {
  const { t } = useTranslation();
  const router = useWebAppRouter();
  return (
    <WebAppMain>
      <ContactsTabs />
      <MainButton
        onClick={() => router.push({ pathname: "/webapp/contacts/add" })}
        label={t("add")}
      />
    </WebAppMain>
  );
};
