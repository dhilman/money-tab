import {
  HomeIcon,
  LockIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { usePlatform } from "~/components/provider/platform/context";
import { MyLink } from "~/components/router/link";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { URLS } from "~/lib/consts/urls";

interface TrpcError {
  data?: { code?: string } | null;
}

interface Props {
  error?: TrpcError | null;
}

export const ErrorPage = ({ error }: Props) => {
  const { t } = useTranslation();

  if (error?.data?.code === "NOT_FOUND") {
    return (
      <WebAppMain>
        <ErrorBento
          icon={LockIcon}
          title={t("error.not_found_or_private")}
          description={t("error.not_found_or_private_description")}
          hint={t("error.ask_someone_to_make_public")}
        />
        <div className="h-12" />
        <Buttons />
      </WebAppMain>
    );
  }

  return (
    <WebAppMain>
      <ErrorBento
        icon={TriangleAlertIcon}
        title={t("error.page_load")}
        description={t("error.page_load_description")}
      />
      <div className="h-6" />
      <Buttons withSupport />
    </WebAppMain>
  );
};

interface ButtonsProps {
  withSupport?: boolean;
}

const Buttons = ({ withSupport }: ButtonsProps) => {
  const { t } = useTranslation();
  const platform = usePlatform();

  return (
    <Bento className="space-y-0.5">
      <Button variant="accent" className="font-semibold" asChild>
        <MyLink route={{ pathname: "/webapp" }}>
          <HomeIcon className="mr-1.5 h-4 w-4" />
          {t("return_home")}
        </MyLink>
      </Button>
      {withSupport && (
        <Button
          variant="ghost"
          onClick={() => platform.openTgLink(URLS.TG_SUPPORT)}
        >
          {t("contact_support")}
        </Button>
      )}
    </Bento>
  );
};

interface ErrorBentoProps {
  icon: LucideIcon;
  title: string;
  description: string;
  hint?: string;
}

const ErrorBento = ({ icon, title, description, hint }: ErrorBentoProps) => {
  return (
    <Bento>
      <BentoContent className="flex w-full flex-col items-center px-6 py-6">
        <Icon size="3xl" variant="hint" Icon={icon} round />
        <div className="mt-2.5 space-y-0.5 text-center">
          <div className="text-xl font-bold">{title}</div>
          <div className="text-hint text-base font-medium">{description}</div>
        </div>
      </BentoContent>
      {hint && (
        <div className="text-hint mt-1 px-2 text-center text-sm leading-tight">
          {hint}
        </div>
      )}
    </Bento>
  );
};
