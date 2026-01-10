import { ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { CurrencyListIcon } from "~/components/form/currency-select";
import { TourProgress } from "~/components/pages/tour/tour-progress";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { MyLink } from "~/components/router/link";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import { getCurrencyByCodeWithDefault } from "~/lib/amount/currencies";

export const TourPage1 = () => {
  const { t } = useTranslation();
  const { user } = useProfile();
  const currency = getCurrencyByCodeWithDefault(user.currencyCode);
  return (
    <WebAppMain>
      <Bento>
        <Image
          src="/poster/tour-expenses.webp"
          alt="MoneyTab"
          height="358"
          width="358"
          className="mb-2 aspect-square w-full rounded-2xl"
        />
      </Bento>
      <TourProgress />
      <Bento className="text-center">
        <div className="text-2xl font-bold">MoneyTab</div>
        <div className="mt-2 text-base">{t("tour_intro_subtitle")}</div>
      </Bento>
      <Bento className="mt-6">
        <BentoContent>
          <ListItem
            as={MyLink}
            route={{
              pathname: "/webapp/settings/currency",
              query: { force: "true" },
            }}
            className="z-20"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
              e.stopPropagation()
            }
          >
            <ListItemLeft>
              <CurrencyListIcon className="h-10 w-10" code={currency.code} />
            </ListItemLeft>
            <ListItemBody>
              <div>
                <div className="text-hint text-sm">{t("default_currency")}</div>
                <div>{currency.name}</div>
              </div>
              <ChevronRightIcon className="ml-auto h-4 w-4" />
            </ListItemBody>
          </ListItem>
        </BentoContent>
      </Bento>
    </WebAppMain>
  );
};

export const TourPage2 = () => {
  const { t } = useTranslation();
  return (
    <WebAppMain>
      <Bento>
        <Image
          src="/poster/tour-subs.webp"
          alt="Subscriptions"
          height="358"
          width="358"
          className="mb-2 aspect-square w-full rounded-2xl"
        />
      </Bento>
      <TourProgress />
      <Bento className="text-center">
        <div className="text-2xl font-bold">{t("subscriptions")}</div>
        <div className="mt-2 text-base">{t("tour_subs_subtitle")}</div>
      </Bento>
    </WebAppMain>
  );
};

export const TourPage3 = () => {
  const { t } = useTranslation();
  return (
    <WebAppMain>
      <Bento>
        <Image
          src="/poster/tour-expense.webp"
          alt="Expense"
          height="358"
          width="358"
          className="mb-2 aspect-square w-full rounded-2xl"
        />
      </Bento>
      <TourProgress />
      <Bento className="text-center">
        <div className="text-2xl font-bold">{t("tour_shared_title")}</div>
        <div className="mt-2 text-base">{t("tour_shared_subtitle")}</div>
      </Bento>
    </WebAppMain>
  );
};
