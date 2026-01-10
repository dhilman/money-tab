import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { ParticipantsOverview } from "~/components/common/participants/overview";
import { PayerSelect } from "~/components/common/participants/payer-select";
import { ParticipantsSelect } from "~/components/common/participants/select";
import {
  FormAmountInput,
  useCurrencyOptions,
} from "~/components/form/amount-input";
import { CurrencySelect } from "~/components/form/currency-select";
import { FormTextInput } from "~/components/form/form-text-input";
import { SubCreateSummary } from "~/components/pages/sub/create/sub-create-summary";
import {
  EndDateInput,
  SubDateInputs,
} from "~/components/pages/sub/create/sub-dates-inputs";
import { useSubEditCtx } from "~/components/pages/sub/edit/sub-edit-provider";
import type { Currency } from "~/lib/amount/currencies";

export const SubEditPage = () => {
  return (
    <WebAppMain className="flex flex-col gap-4">
      <Screen />
    </WebAppMain>
  );
};

const Screen = () => {
  const { screen, setScreen } = useSubEditCtx();

  switch (screen) {
    case "currency":
      return <CurrencySelectScreen />;
    case "edit_payer":
      return <PayerSelect onSelected={() => setScreen("main")} />;
    case "edit_users":
      return <ParticipantsSelect el="sub" />;
    default:
      return <MainScreen />;
  }
};

const CurrencySelectScreen = () => {
  const { setCurrency, setScreen } = useSubEditCtx();
  const currencyOptions = useCurrencyOptions();
  const onCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setScreen("main");
  };

  return (
    <Bento>
      <CurrencySelect onSelect={onCurrencyChange} options={currencyOptions} />
    </Bento>
  );
};

const MainScreen = () => {
  const { t } = useTranslation();
  const {
    isCreatorOnly,
    setScreen,
    amount,
    setAmount,
    currency,
    name,
    setName,
    ...rest
  } = useSubEditCtx();

  return (
    <>
      <Bento>
        <BentoContent>
          <FormAmountInput
            amount={amount}
            currency={currency}
            label={t("price")}
            setAmount={setAmount}
            onEditCurrency={() => setScreen("currency")}
          />
          <FormTextInput
            id="name"
            value={name}
            onChange={setName}
            label={t("name")}
          />
        </BentoContent>
      </Bento>

      {isCreatorOnly ? (
        <SubDateInputs {...rest} reminder={null} defaultExpanded />
      ) : (
        <Bento>
          <BentoContent>
            <EndDateInput endDate={rest.endDate} setEndDate={rest.setEndDate} />
          </BentoContent>
          <div className="text-hint mt-1 w-full px-2 text-left text-sm">
            {t("editing_of_sub_limited_desc")}
          </div>
        </Bento>
      )}

      <ParticipantsOverview
        onEdit={() => setScreen("edit_users")}
        onEditPayer={() => setScreen("edit_payer")}
      />

      <div />

      <Summary />
    </>
  );
};

const Summary = () => {
  const sub = useSubEditCtx();

  return <SubCreateSummary sub={sub} />;
};
