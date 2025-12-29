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
import { useTxEditCtx } from "~/components/pages/tx/form/tx-form-ctx";
import { TxEditOptions } from "~/components/pages/tx/form/tx-form-options";
import { TxEditSummary } from "~/components/pages/tx/form/tx-form-summary";
import { Separator } from "~/components/ui/list";
import { type Currency } from "~/lib/amount/currencies";

export const TxEditPage = () => {
  return (
    <WebAppMain className="flex flex-col gap-4">
      <Screen />
    </WebAppMain>
  );
};

function Screen() {
  const { screen, setScreen } = useTxEditCtx();
  switch (screen) {
    case "currency":
      return <CurrencySelectScreen />;
    case "edit_payer":
      return <PayerSelect onSelected={() => setScreen("main")} />;
    case "edit_users":
      return <ParticipantsSelect el="tx" />;
    default:
      return <MainScreen />;
  }
}

const MainScreen = () => {
  const { setScreen } = useTxEditCtx();

  return (
    <>
      <Bento>
        <BentoContent className="rounded-xl">
          <TxAmountInput />
          <DescriptionInput />
        </BentoContent>
      </Bento>
      <TxEditOptions />
      <div />
      <ParticipantsOverview
        onEdit={() => setScreen("edit_users")}
        onEditPayer={() => setScreen("edit_payer")}
      />
      <div />
      <Bento className="px-8">
        <Separator />
      </Bento>
      <div />
      <TxEditSummary />
    </>
  );
};

const CurrencySelectScreen = () => {
  const { setCurrency, setScreen } = useTxEditCtx();
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

const TxAmountInput = () => {
  const { t } = useTranslation();
  const { amount, setAmount, currency, setScreen } = useTxEditCtx();
  return (
    <FormAmountInput
      amount={amount}
      currency={currency}
      label={t("amount")}
      setAmount={setAmount}
      onEditCurrency={() => setScreen("currency")}
    />
  );
};

const DescriptionInput = () => {
  const { t } = useTranslation();
  const { description, setDescription } = useTxEditCtx();

  return (
    <FormTextInput
      id="description"
      label={t("description")}
      value={description}
      onChange={setDescription}
    />
  );
};
