import { useMutation } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useState } from "react";
import toast from "react-hot-toast";
import {
  ParticipantsProvider,
  useParticipantsCtx,
} from "~/components/common/participants/provider";
import { useParticipantsReducer } from "~/components/common/participants/reducer";
import { useMe, useProfile } from "~/components/provider/auth/auth-provider";
import {
  BackButton,
  MainButton,
  usePlatform,
} from "~/components/provider/platform/context";
import { useWebAppRouter } from "~/components/router/router";
import {
  getCurrencyByCodeWithDefault,
  type Currency,
} from "~/lib/amount/currencies";
import type { Cycle, ReminderValue } from "~/lib/consts/types";
import { getDateLocal } from "~/lib/dates/format-dates";
import i18n from "~/lib/i18n";
import {
  validAmount,
  validContribs,
  validEndDate,
  validReminder,
} from "~/lib/validate/validate";
import { api, type RouterInputs } from "~/utils/api";

interface Params {
  amount: number;
  currency: Currency;
  name: string;
  startDate: string;
  endDate: string;
  cycle: Cycle;
  reminder: ReminderValue | null;
  trial: Cycle | null;
}

type Screen = "main" | "edit_users" | "edit_payer" | "currency";

interface ContextType extends Params {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  setAmount: (amount: number) => void;
  setCurrency: (currency: Currency) => void;
  setName: (name: string) => void;
  setStartDate: (startDate: string) => void;
  setEndDate: (endDate: string) => void;
  setCycle: (cycle: Cycle) => void;
  setReminder: (reminder: ReminderValue | null) => void;
  setTrial: (trial: Cycle | null) => void;
}

const Context = createContext<ContextType | null>(null);

export const useSubCreateCtx = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useSubFormCtx must be used within a SubFormProvider");
  }
  return context;
};

interface Props {
  children: React.ReactNode;
  userId: string | null;
  groupId: string | null;
}

export const SubFormProvider = ({
  children,
  userId: startUserId,
  groupId: startGroupId,
}: Props) => {
  const me = useMe();
  const [screen, setScreen] = useState<Screen>("main");
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useCurrencyState();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(getDateLocal(new Date()));
  const [endDate, setEndDate] = useState("");
  const [cycle, setCycle] = useState<Cycle>({ unit: "MONTH", value: 1 });
  const [reminder, setReminder] = useState<Params["reminder"] | null>(null);
  const [trial, setTrial] = useState<Cycle | null>(null);
  const [participants, updateParticipants] = useParticipantsReducer({
    meId: me.id,
    amount,
    startUserId,
    startGroupId,
  });

  return (
    <Context.Provider
      value={{
        screen,
        setScreen,
        amount,
        currency,
        name,
        startDate,
        endDate,
        cycle,
        reminder,
        trial,
        setAmount,
        setCurrency,
        setName,
        setStartDate,
        setEndDate,
        setCycle,
        setReminder,
        setTrial,
      }}
    >
      <ParticipantsProvider
        currency={currency}
        state={participants}
        update={updateParticipants}
      >
        <BackButton
          onClick={screen === "main" ? undefined : () => setScreen("main")}
        />
        {children}
        <SubMainButton />
      </ParticipantsProvider>
    </Context.Provider>
  );
};

function SubMainButton() {
  const { amount, screen, setScreen } = useSubCreateCtx();
  const { create, isLoading } = useCreateMutation();

  const onClickMain = useCallback(() => {
    if (screen === "main") create();
    else setScreen("main");
  }, [create, screen, setScreen]);

  return (
    <MainButton
      onClick={onClickMain}
      label={screen === "main" ? i18n.t("save") : i18n.t("done")}
      disabled={screen === "main" && amount <= 0}
      isLoading={isLoading}
    />
  );
}

type SubCreateReq = RouterInputs["sub"]["create"];

const useCreateMutation = () => {
  const { user: me, register } = useProfile();
  const ctx = api.useUtils();
  const platform = usePlatform();
  const router = useWebAppRouter();

  const state = useSubCreateCtx();
  const participants = useParticipantsCtx();

  const { mutate, isLoading } = useMutation({
    mutationFn: async () => {
      const data: SubCreateReq = {
        name: state.name,
        value: state.amount,
        currencyCode: state.currency.code,
        startDate: state.startDate,
        endDate: state.endDate ? state.endDate : null,
        cycle: state.cycle,
        reminder: state.reminder,
        trial: state.trial,
        contribs: participants.getContribs(),
        groupId: participants.getGroupId(),
      };

      console.log("create subscription", data);

      if (!validate(me.id, data)) {
        throw new Error("Invalid data");
      }

      await register();
      return await ctx.client.sub.create.mutate(data);
    },
    onSuccess: (id) => {
      void ctx.user.start.invalidate();
      platform.haptic.notification("success");
      void router.replace({
        pathname: "/webapp/sub/[id]",
        query: { id: id },
      });
    },
    onError: (err) => {
      platform.haptic.notification("error");
      if (err instanceof Error && err.message === "Invalid data") return;
      toast.error("Something went wrong");
    },
  });

  return { create: mutate, isLoading };
};

function validate(meId: string, v: SubCreateReq): boolean {
  if (!validAmount(v.value)) return false;

  if (v.name.length === 0) {
    toast.error(i18n.t("error.enter_sub_name"));
    return false;
  }

  if (v.trial && v.trial.value <= 0) {
    toast.error(i18n.t("error.enter_positive_trial"));
    return false;
  }

  if (v.cycle.value <= 0) {
    toast.error(i18n.t("error.enter_positive_freq"));
    return false;
  }

  if (!validEndDate(v)) return false;
  if (!validReminder(v)) {
    return false;
  }

  if (!validContribs(meId, v.value, v.contribs)) {
    return false;
  }

  return true;
}

const useCurrencyState = () => {
  const { user: me, subscriptions, transactions } = useProfile();
  function getInitial() {
    if (me.currencyCode) return me.currencyCode;
    if (subscriptions[0]?.currencyCode) return subscriptions[0].currencyCode;
    if (transactions[0]?.currencyCode) return transactions[0].currencyCode;
    return undefined;
  }
  return useState(getCurrencyByCodeWithDefault(getInitial()));
};
