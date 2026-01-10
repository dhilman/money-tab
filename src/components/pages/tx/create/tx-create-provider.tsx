import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  ParticipantsProvider,
  useParticipantsCtx,
} from "~/components/common/participants/provider";
import { useParticipantsReducer } from "~/components/common/participants/reducer";
import { type Attachment } from "~/components/form/file-input";
import {
  TxEditContext,
  type TxEditScreen,
  useTxEditCtx,
} from "~/components/pages/tx/form/tx-form-ctx";
import { useProfile } from "~/components/provider/auth/auth-provider";
import {
  BackButton,
  MainButton,
  usePlatform,
} from "~/components/provider/platform/context";
import { useWebAppRouter } from "~/components/router/router";
import { getCurrencyByCodeWithDefault } from "~/lib/amount/currencies";
import i18n from "~/lib/i18n";
import {
  validAmount,
  validFiles,
  validIsInSplit,
  validSplitsAmounts,
} from "~/lib/validate/validate";
import { api, type RouterInputs } from "~/utils/api";

interface Props {
  userId: string | null;
  groupId: string | null;
  children: React.ReactNode;
}

export const TxCreateProvider = ({
  userId: startUserId,
  groupId: startGroupId,
  children,
}: Props) => {
  const { user: me, transactions } = useProfile();
  const [screen, setScreen] = useState<TxEditScreen>("main");
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState(
    getCurrencyByCodeWithDefault(
      me.currencyCode || transactions[0]?.currencyCode,
    ),
  );
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [participants, updateParticipants] = useParticipantsReducer({
    meId: me.id,
    amount,
    startUserId,
    startGroupId,
  });

  return (
    <TxEditContext.Provider
      value={{
        type: "create",
        screen,
        setScreen,
        amount,
        setAmount,
        currency,
        setCurrency,
        description,
        setDescription,
        date,
        setDate,
        time,
        setTime,
        files,
        setFiles,
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
        <TxMainButton />
      </ParticipantsProvider>
    </TxEditContext.Provider>
  );
};

function TxMainButton() {
  const { amount, screen, setScreen } = useTxEditCtx();
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

type TxCreateReq = RouterInputs["tx"]["create"];

function useCreateMutation() {
  const { user: me, register } = useProfile();
  const ctx = api.useUtils();
  const platform = usePlatform();
  const router = useWebAppRouter();

  const state = useTxEditCtx();
  const participants = useParticipantsCtx();

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: async () => {
      const data: TxCreateReq = {
        value: state.amount,
        currencyCode: state.currency.code,
        description: state.description,
        date: getDateTime(state.date, state.time),
        files: state.files,
        contributions: participants.getContribs(),
        groupId: participants.getGroupId(),
      };

      console.log("create transaction", data);

      if (!validate(me.id, data, state.files)) {
        throw new Error("Invalid data");
      }

      await register();
      return await ctx.client.tx.create.mutate(data);
    },
    onSuccess: (txId) => {
      void ctx.user.start.invalidate();
      platform.haptic.notification("success");
      void router.replace({ pathname: "/webapp/tx/[id]", query: { id: txId } });
    },
    onError: (err) => {
      platform.haptic.notification("error");
      if (err instanceof Error && err.message === "Invalid data") return;
      toast.error(i18n.t("error.generic"));
    },
  });

  return { create: mutate, isLoading };
}

function getDateTime(date: string, time: string) {
  if (!date) return null;
  if (!time) return date;
  return new Date(`${date}T${time}`).toISOString();
}

function validate(meId: string, v: TxCreateReq, files: Attachment[]) {
  if (!validAmount(v.value)) return false;

  if (!validIsInSplit(v.contributions, meId)) return false;
  if (!validSplitsAmounts(v.contributions, v.value)) return false;

  if (!validFiles(files)) return false;

  return true;
}
