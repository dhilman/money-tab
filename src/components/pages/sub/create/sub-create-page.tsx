import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
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
import { useSubCreateCtx } from "~/components/pages/sub/create/sub-create-provider";
import { SubCreateSummary } from "~/components/pages/sub/create/sub-create-summary";
import { List, Separator } from "~/components/ui/list";
import type { Currency } from "~/lib/amount/currencies";
import { SubDateInputs } from "./sub-dates-inputs";

export function SubCreatePage() {
  return (
    <WebAppMain className="flex flex-col gap-4">
      <Screen />
    </WebAppMain>
  );
}

function Screen() {
  const { screen, setScreen } = useSubCreateCtx();
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
}

const MainScreen = () => {
  const { setScreen, ...rest } = useSubCreateCtx();

  return (
    <>
      <Bento>
        <List>
          <AmountInput />
          <NameInput />
        </List>
      </Bento>

      <SubDateInputs {...rest} />

      <ParticipantsOverview
        onEdit={() => setScreen("edit_users")}
        onEditPayer={() => setScreen("edit_payer")}
      />

      <div />

      <Bento className="px-8">
        <Separator />
      </Bento>

      <div />

      <SubCreateSummary sub={rest} />
    </>
  );
};

const CurrencySelectScreen = () => {
  const { setCurrency, setScreen } = useSubCreateCtx();
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

const AmountInput = () => {
  const { t } = useTranslation();
  const { amount, setAmount, currency, setScreen } = useSubCreateCtx();
  return (
    <FormAmountInput
      amount={amount}
      currency={currency}
      label={t("price")}
      setAmount={setAmount}
      onEditCurrency={() => setScreen("currency")}
    />
  );
};

const NameInput = () => {
  const { t } = useTranslation();
  const { name, setName } = useSubCreateCtx();
  return (
    <FormTextInput
      id="name"
      value={name}
      onChange={setName}
      label={t("name")}
    />
  );
};
