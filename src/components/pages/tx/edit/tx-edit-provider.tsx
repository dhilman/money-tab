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
import {
  buildReceiptDataPayload,
  isItemizedAndInvalid,
} from "~/components/pages/tx/form/tx-receipt-payload";
import { useMe } from "~/components/provider/auth/auth-provider";
import {
  BackButton,
  MainButton,
  usePlatform,
} from "~/components/provider/platform/context";
import {
  ReceiptProviderWrapper,
  useReceiptCtxOptional,
} from "~/components/receipt";
import { useWebAppRouter } from "~/components/router/router";
import {
  getCurrencyByCodeWithDefault,
  type Currency,
} from "~/lib/amount/currencies";
import { getDateAndTimeLocalFromUTC } from "~/lib/dates/format-dates";
import i18n from "~/lib/i18n";
import { receiptDataEqual, type ReceiptData } from "~/lib/receipt";
import { ReceiptDataSchema } from "~/lib/receipt/schema";
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
  const [dateTime, setDateTime] = useState(parseDateOrDateTime(tx.txDate, tx.txTime));
  const [files, setFiles] = useState<Attachment[]>(
    tx.files.map((v) => ({
      id: v.id,
      url: v.url,
      key: "",
      size: v.size ?? 0,
      type: v.type ?? "",
    })),
  );
  const initialReceiptData = parseInitialReceiptData(tx.receiptData);
  const [participants, updateParticipants] = useParticipantsEditReducer({
    meId: me.id,
    amount,
    contribs: tx.contribs,
    groupId: tx.groupId,
    startSplitMode: initialReceiptData ? "itemized" : "amount",
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
        <ReceiptProviderWrapper initialData={initialReceiptData}>
          <BackButton
            onClick={screen === "main" ? undefined : () => setScreen("main")}
          />
          {children}
          <TxMainButton tx={tx} />
        </ReceiptProviderWrapper>
      </ParticipantsProvider>
    </TxEditContext.Provider>
  );
};

function parseInitialReceiptData(raw: unknown): ReceiptData | null {
  if (raw == null) return null;
  const result = ReceiptDataSchema.safeParse(raw);
  if (result.success) return result.data;
  // Defense-in-depth: writes are validated, so a parse failure here means a
  // legacy or out-of-band row. Drop it rather than crash and treat the tx as
  // a non-itemized split.
  console.warn("Failed to parse tx.receiptData; ignoring", result.error);
  return null;
}

function parseDateOrDateTime(txDate: Date | null, txTime: string | null) {
  if (!txDate) return { date: "", time: "" };
  const dateStr = txDate.toISOString().slice(0, 10);
  if (!txTime) return { date: dateStr, time: "" };
  return getDateAndTimeLocalFromUTC(dateStr + " " + txTime);
}

function TxMainButton({ tx }: { tx: Tx }) {
  const { screen, setScreen } = useTxEditCtx();
  const { splitMode } = useParticipantsCtx();
  const receiptCtx = useReceiptCtxOptional();
  const { mutate, isPending: isLoading } = useUpdateMutation(tx.id);
  const isEdited = useIsEdited(tx);

  const onClickMain = useCallback(() => {
    if (screen === "main") mutate();
    else setScreen("main");
  }, [screen, setScreen, mutate]);

  // Itemized mode is gated by receipt-level validation; the ItemizedSection
  // bridge keeps the form amount aligned with the per-party split.
  const itemizedInvalid = isItemizedAndInvalid(splitMode, receiptCtx);

  return (
    <MainButton
      onClick={onClickMain}
      label={screen === "main" ? i18n.t("save") : i18n.t("done")}
      disabled={screen === "main" && (!isEdited || itemizedInvalid)}
      isLoading={isLoading}
    />
  );
}

function useIsEdited(tx: Tx) {
  const state = useTxEditCtx();
  const parties = useParticipantsCtx();
  const receiptCtx = useReceiptCtxOptional();
  const txDateTime = useRef(parseDateOrDateTime(tx.txDate, tx.txTime));

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
    if (isParticipantsEdited(tx.contribs, parties)) return true;

    const currentReceipt = buildReceiptDataPayload(parties.splitMode, receiptCtx);
    if (!receiptDataEqual(currentReceipt, tx.receiptData ?? null)) return true;

    return false;
  }, [
    parties,
    receiptCtx,
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
    tx.receiptData,
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
  const receiptCtx = useReceiptCtxOptional();

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
        receiptData: buildReceiptDataPayload(participants.splitMode, receiptCtx),
      };

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
