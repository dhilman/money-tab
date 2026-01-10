import { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import {
  ContribsProvider,
  useContribsCtx,
} from "~/components/common/contribs/provider";
import { ErrorPage } from "~/components/pages/error";
import { type TxApi, useTxApi } from "~/components/pages/tx/get/tx-api-hooks";
import { useProfile } from "~/components/provider/auth/auth-provider";
import {
  MainButton,
  usePlatform,
} from "~/components/provider/platform/context";
import i18n from "~/lib/i18n";
import { getTgWebAppShareUrl } from "~/lib/url/share-url";
import { calcIsPublic } from "~/lib/visibility";

type Context = {
  tx: TxApi;
  copyTxUrl: () => void;
  onArchiveTx: () => Promise<void>;
  onLeaveTx: () => Promise<void>;
  invalidate: () => void;
  isLoading: boolean;
};

const Context = createContext<Context | null>(null);

export const useTx = () => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useTx must be used within a TxProvider");
  }
  return ctx;
};

interface Props {
  shortId: string;
  shortContribId?: string;
  children: React.ReactNode;
}

export const TxProvider = ({ shortId, shortContribId, children }: Props) => {
  const { user } = useProfile();
  const platform = usePlatform();

  const {
    tx,
    error,
    isLoading,
    invalidate,
    archiveMutation,
    leaveMutation,
    joinMutation,
  } = useTxApi({ id: shortId, contribId: shortContribId });

  const copyTxUrl = (contribId?: string) => {
    if (!tx) return;
    const url = getTgWebAppShareUrl(
      { type: "TX", id: tx.id, contribId },
      i18n.t("share_message_tx"),
    );
    platform.openTgLink(url);
  };

  const myContrib = tx?.contribs.find((v) => v.userId === user.id);
  const isCreator = tx?.createdById === user.id;
  const isParticipant = myContrib ? true : false;

  function getJoinContribId() {
    if (!shortContribId) return null;
    if (!tx) return null;
    if (isParticipant) return null;
    if (isLoading) return null;
    const contrib = tx.contribs.find((v) => v.id.startsWith(shortContribId));
    return contrib?.id || null;
  }

  if (!tx) {
    if (!error) return null;
    return <ErrorPage error={error} />;
  }

  return (
    <Context.Provider
      value={{
        tx,
        copyTxUrl,
        onArchiveTx: archiveMutation.mutateAsync,
        onLeaveTx: leaveMutation.mutateAsync,
        invalidate,
        isLoading,
      }}
    >
      <ContribsProvider
        value={{
          id: tx.id,
          joinContribId: getJoinContribId(),
          creatorId: tx.createdById,
          isCreator: isCreator,
          isParticipant: isParticipant,
          isVisible: calcIsPublic({
            createdAt: tx.createdAt,
            visibility: tx.visibility,
          }),
          amount: tx.amount,
          currencyCode: tx.currencyCode,
          contribs: tx.contribs,
          copyUrl: copyTxUrl,
          joinMutation: joinMutation,
          isLoading: isLoading,
        }}
      >
        {children}
        <JoinMainButton />
      </ContribsProvider>
    </Context.Provider>
  );
};

const JoinMainButton = () => {
  const { joinContribId, joinMutation } = useContribsCtx();
  const { t } = useTranslation();

  if (!joinContribId) return null;

  return (
    <MainButton
      onClick={() => joinMutation.mutate(joinContribId)}
      label={t("confirm_join")}
      isLoading={joinMutation.isPending}
    />
  );
};
