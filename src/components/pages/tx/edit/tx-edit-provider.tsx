import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ParticipantsProvider,
  useParticipantsCtx,
} from "~/components/common/participants/provider";
import {
  isParticipantsEdited,
  useParticipantsEditReducer,
} from "~/components/common/participants/reducer";
import { type Attachment } from "~/components/form/file-input";
import {
  TxEditContext,
  useTxEditCtx,
  type TxEditScreen,
} from "~/components/pages/tx/form/tx-form-ctx";
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
import { getDateAndTimeLocalFromUTC } from "~/lib/dates/format-dates";
import i18n from "~/lib/i18n";
import {
  validAmount,
  validFiles,
  validIsInSplit,
  validSplitsAmounts,
} from "~/lib/validate/validate";
import { api, type RouterInputs, type RouterOutputs } from "~/utils/api";

type Tx = RouterOutputs["tx"]["get"];

interface Props {
  tx: Tx;
  children: React.ReactNode;
}

export const TxEditProvider = ({ tx, children }: Props) => {
  const me = useMe();
  const [screen, setScreen] = useState<TxEditScreen>("main");
  const [amount, setAmount] = useState(tx.amount);
  const [currency, setCurrency] = useState<Currency>(
    getCurrencyByCodeWithDefault(tx.currencyCode),
  );
  const [description, setDescription] = useState(tx.description || "");
  const [dateTime, setDateTime] = useState(parseDateOrDateTime(tx.date));
  const [files, setFiles] = useState<Attachment[]>(
    tx.files.map((v) => ({
      id: v.id,
      url: v.url,
      key: "",
      size: v.size ?? 0,
      type: v.type ?? "",
    })),
  );
  const [participants, updateParticipants] = useParticipantsEditReducer({
    meId: me.id,
    amount,
    contribs: tx.contribs,
    groupId: tx.groupId,
  });

  return (
    <TxEditContext.Provider
      value={{
        type: "edit",
        screen,
        setScreen,
        amount,
        setAmount,
        currency,
        setCurrency,
        description,
        setDescription,
        date: dateTime.date,
        setDate: (v) => setDateTime({ ...dateTime, date: v }),
        time: dateTime.time,
        setTime: (v) => setDateTime({ ...dateTime, time: v }),
        files: files,
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
        <TxMainButton tx={tx} />
      </ParticipantsProvider>
    </TxEditContext.Provider>
  );
};

function parseDateOrDateTime(date: string | null) {
  if (!date) return { date: "", time: "" };
  if (date.length === 10) return { date, time: "" };
  return getDateAndTimeLocalFromUTC(date);
}

function TxMainButton({ tx }: { tx: Tx }) {
  const { screen, setScreen } = useTxEditCtx();
  const { mutate, isPending: isLoading } = useUpdateMutation(tx.id);
  const isEdited = useIsEdited(tx);

  const onClickMain = useCallback(() => {
    if (screen === "main") mutate();
    else setScreen("main");
  }, [screen, setScreen, mutate]);

  return (
    <MainButton
      onClick={onClickMain}
      label={screen === "main" ? i18n.t("save") : i18n.t("done")}
      disabled={screen === "main" && !isEdited}
      isLoading={isLoading}
    />
  );
}

function useIsEdited(tx: Tx) {
  const state = useTxEditCtx();
  const parties = useParticipantsCtx();
  const txDateTime = useRef(parseDateOrDateTime(tx.date));

  return useMemo(() => {
    if (state.amount !== tx.amount) return true;
    if (state.currency.code !== tx.currencyCode) return true;
    if (state.description !== tx.description) return true;
    if (txDateTime.current.date !== state.date) return true;
    if (txDateTime.current.time !== state.time) return true;

    if (state.files.length !== tx.files.length) return true;
    if (state.files.some((f) => !tx.files.find((v) => v.id === f.id))) {
      return true;
    }

    if (tx.groupId !== parties.getGroupId()) return true;
    return isParticipantsEdited(tx.contribs, parties);
  }, [
    parties,
    state.amount,
    state.currency.code,
    state.date,
    state.description,
    state.files,
    state.time,
    tx.amount,
    tx.contribs,
    tx.currencyCode,
    tx.description,
    tx.files,
    tx.groupId,
  ]);
}

type UpdateReq = RouterInputs["tx"]["update"];

function useUpdateMutation(id: string) {
  const me = useMe();
  const ctx = api.useUtils();
  const platform = usePlatform();
  const router = useWebAppRouter();

  const state = useTxEditCtx();
  const participants = useParticipantsCtx();

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: async () => {
      const data: UpdateReq = {
        id: id,
        amount: state.amount,
        currencyCode: state.currency.code,
        description: state.description,
        date: getDateTime(state.date, state.time),
        groupId: participants.getGroupId(),
        contribs: participants.getContribs(),
        files: state.files,
      };

      console.log("create transaction", data);

      if (!validate(me.id, data, state.files)) {
        throw new Error("Invalid data");
      }

      return await ctx.client.tx.update.mutate(data);
    },
    onSuccess: () => {
      void ctx.tx.get.invalidate();
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

  return { mutate, isPending: isLoading };
}

function getDateTime(date: string, time: string) {
  if (!date) return null;
  if (!time) return date;
  return new Date(`${date}T${time}`).toISOString();
}

function validate(meId: string, v: UpdateReq, files: Attachment[]) {
  if (!validAmount(v.amount)) return false;
  if (!validFiles(files)) return false;

  if (!validIsInSplit(v.contribs, meId)) return false;
  if (!validSplitsAmounts(v.contribs, v.amount)) return false;

  return true;
}
