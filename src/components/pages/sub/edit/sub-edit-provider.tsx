import { useMutation } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import {
  ParticipantsProvider,
  useParticipantsCtx,
} from "~/components/common/participants/provider";
import {
  isParticipantsEdited,
  useParticipantsEditReducer,
} from "~/components/common/participants/reducer";
import { useMe } from "~/components/provider/auth/auth-provider";
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
import { type Cycle } from "~/lib/consts/types";
import i18n from "~/lib/i18n";
import {
  validAmount,
  validContribs,
  validEndDate,
} from "~/lib/validate/validate";
import { api, type RouterInputs, type RouterOutputs } from "~/utils/api";

type Sub = RouterOutputs["sub"]["get"];
type SubUpdate = RouterInputs["sub"]["update"];
type Screen = "main" | "currency" | "edit_users" | "edit_payer";

interface Context {
  orig: Sub;

  id: string;
  isCreatorOnly: boolean;

  screen: Screen;
  setScreen: (screen: Screen) => void;

  name: string;
  setName: (name: string) => void;
  amount: number;
  setAmount: (amount: number) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  startDate: string;
  setStartDate: (startDate: string) => void;
  endDate: string;
  setEndDate: (endDate: string) => void;
  cycle: Cycle;
  setCycle: (cycle: Cycle) => void;
  trial: Cycle | null;
  setTrial: (trial: Cycle | null) => void;
}

const SubEditContext = createContext<Context | null>(null);

export function useSubEditCtx() {
  const ctx = useContext(SubEditContext);
  if (!ctx)
    throw new Error("useSubEditCtx must be used within SubEditProvider");
  return ctx;
}

interface Props {
  sub: Sub;
  children: React.ReactNode;
}

export const SubEditProvider = ({ sub, children }: Props) => {
  const me = useMe();
  const [screen, setScreen] = useState<Screen>("main");
  const [name, setName] = useState(sub.name);
  const [amount, setAmount] = useState(sub.amount);
  const [currency, setCurrency] = useState(
    getCurrencyByCodeWithDefault(sub.currencyCode)
  );
  const [startDate, setStartDate] = useState(sub.startDate);
  const [endDate, setEndDate] = useState(sub.endDate ?? "");
  const [cycle, setCycle] = useState<Cycle>({
    unit: sub.cycleUnit,
    value: sub.cycleValue,
  });
  const [trial, setTrial] = useState<Cycle | null>(() => {
    if (sub.trialUnit && sub.trialValue) {
      return { unit: sub.trialUnit, value: sub.trialValue };
    }
    return null;
  });

  const [participants, updateParticipants] = useParticipantsEditReducer({
    meId: me.id,
    amount,
    contribs: sub.contribs,
    groupId: sub.groupId,
  });

  const [isCreatorOnly] = useState(() => {
    if (sub.contribs.length === 1) return true;
    return sub.contribs.every((c) => !c.userId || c.userId === me.id);
  });

  return (
    <SubEditContext.Provider
      value={{
        orig: sub,
        id: sub.id,
        isCreatorOnly,
        screen,
        setScreen,
        name,
        setName,
        amount,
        setAmount,
        currency,
        setCurrency,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        cycle,
        setCycle,
        trial,
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
    </SubEditContext.Provider>
  );
};

function SubMainButton() {
  const { screen, setScreen } = useSubEditCtx();
  const { mutate, isLoading } = useUpdateMutation();
  const isEdited = useIsEdited();

  const onClickMain = useCallback(() => {
    if (screen === "main") mutate();
    else setScreen("main");
  }, [screen, setScreen, mutate]);

  return (
    <MainButton
      onClick={onClickMain}
      label={screen === "main" ? i18n.t("save") : i18n.t("done")}
      isLoading={isLoading}
      disabled={!isEdited}
    />
  );
}

function useIsEdited() {
  const state = useSubEditCtx();
  const parties = useParticipantsCtx();
  return useMemo(() => {
    const sub = state.orig;
    if (state.name !== sub.name) return true;
    if (state.amount !== sub.amount) return true;
    if (state.currency.code !== sub.currencyCode) return true;
    if (state.startDate !== sub.startDate) return true;
    if (state.endDate !== (sub.endDate ?? "")) return true;
    if (state.cycle.unit !== sub.cycleUnit) return true;
    if (state.cycle.value !== sub.cycleValue) return true;
    if ((state.trial?.unit ?? null) !== sub.trialUnit) return true;
    if ((state.trial?.value ?? null) !== sub.trialValue) return true;
    if (parties.getGroupId() !== sub.groupId) return true;

    return isParticipantsEdited(sub.contribs, parties);
  }, [state, parties]);
}

function useUpdateMutation() {
  const me = useMe();
  const ctx = api.useUtils();
  const platform = usePlatform();
  const router = useWebAppRouter();

  const state = useSubEditCtx();
  const participants = useParticipantsCtx();

  const { mutate, isLoading } = useMutation({
    mutationFn: async () => {
      const data: SubUpdate = {
        id: state.id,
        name: state.name,
        groupId: participants.groupId,
        amount: state.amount,
        currencyCode: state.currency.code,
        startDate: state.startDate,
        endDate: state.endDate ? state.endDate : null,
        cycle: state.cycle,
        trial: state.trial,
        contribs: participants.getContribs(),
      };

      console.log("update subscription", data);

      if (!validate(me.id, data)) throw new Error("Invalid data");

      console.log("CALLING UPDATE");
      return await ctx.client.sub.update.mutate(data);
    },
    onSuccess: () => {
      void ctx.sub.get.invalidate();
      void ctx.user.start.invalidate();
      platform.haptic.notification("success");
      void router.back();
    },
    onError: (err) => {
      platform.haptic.notification("error");
      if (err instanceof Error && err.message === "Invalid data") return;
      toast.error(i18n.t("error.generic"));
    },
  });

  return { mutate, isLoading };
}

function validate(meId: string, v: SubUpdate): boolean {
  if (!validAmount(v.amount)) return false;

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

  if (!validContribs(meId, v.amount, v.contribs)) {
    return false;
  }

  return true;
}
