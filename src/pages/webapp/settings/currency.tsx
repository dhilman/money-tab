import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { CurrencySelect } from "~/components/form/currency-select";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { webAppPage } from "~/components/provider/webapp-provider";
import { useTypedQuery, useWebAppRouter } from "~/components/router/router";
import { useCurrencies, type Currency } from "~/lib/amount/currencies";

export default webAppPage(Page);
function Page() {
  const { t } = useTranslation();
  const params = useTypedQuery("/webapp/settings/currency");
  const { options, onChangeCurrency } = useUserCurrency({
    allowMostRecent: params?.force !== "true",
  });

  return (
    <WebAppMain className="flex flex-col gap-6 py-8">
      <Bento>
        <CurrencySelect
          options={[
            {
              label: t("all"),
              options: options,
            },
          ]}
          onSelect={onChangeCurrency}
        />
      </Bento>
    </WebAppMain>
  );
}

function useUserCurrency({ allowMostRecent }: { allowMostRecent: boolean }) {
  const { t } = useTranslation();
  const router = useWebAppRouter();
  const { updateUser } = useProfile();

  const currenciesMap = useCurrencies();
  const mostRecent = useMemo(
    () =>
      ({
        code: t("most_recent"),
        symbol: t("most_recent"),
        name: t("most_recent"),
      }) as Currency,
    [t],
  );

  const options = useMemo(() => {
    const currencies = Object.values(currenciesMap);
    if (!allowMostRecent) {
      return [...currencies];
    }
    return [mostRecent, ...currencies];
  }, [allowMostRecent, currenciesMap, mostRecent]);

  const onChangeCurrency = (v: Currency) => {
    if (v.code === mostRecent.code) {
      updateUser({ currencyCode: null });
    } else {
      updateUser({ currencyCode: v.code });
    }
    router.back();
  };

  return { options, onChangeCurrency };
}
