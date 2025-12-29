import { createContext, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ContribsProvider,
  useContribsCtx,
} from "~/components/common/contribs/provider";
import { ErrorPage } from "~/components/pages/error";
import {
  type SubGetApi,
  type SubInvalidate,
  useSubGet,
} from "~/components/pages/sub/get/sub-api-hooks";
import { useProfile } from "~/components/provider/auth/auth-provider";
import {
  MainButton,
  usePlatform,
} from "~/components/provider/platform/context";
import type { ReminderValue } from "~/lib/consts/types";
import { isBeforeOrEqualToToday } from "~/lib/dates/dates";
import i18n from "~/lib/i18n";
import { getTgWebAppShareUrl } from "~/lib/url/share-url";
import { calcIsPublic } from "~/lib/visibility";

export type SubPageTab = "details" | "contribs";

type Context = {
  sub: SubGetApi;
  isCreator: boolean;
  isParticipant: boolean;
  hasEnded: boolean;
  tab: SubPageTab;
  setTab: (tab: SubPageTab) => void;
  copyUrl: () => void;
  invalidate: SubInvalidate;
  isLoading: boolean;
  updateReminder: (reminder: ReminderValue | null) => void;
};

const Context = createContext<Context | null>(null);

export const useSubCtx = () => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useSub must be used within a SubProvider");
  }
  return ctx;
};

interface Props {
  shortId: string;
  shortContribId?: string;
  tab?: SubPageTab;
  children: React.ReactNode;
}

export const SubProvider = ({
  shortId,
  shortContribId,
  tab: startTab,
  children,
}: Props) => {
  const { user } = useProfile();
  const platform = usePlatform();
  const [tab, setTab] = useState(() => {
    if (startTab) return startTab;
    if (shortContribId) return "contribs";
    return "details";
  });

  const {
    sub,
    isLoading,
    error,
    invalidate,
    joinMutation,
    updateReminderMutation,
  } = useSubGet({
    id: shortId,
    contribId: shortContribId,
  });

  const copyUrl = (contribId?: string) => {
    const url = getTgWebAppShareUrl(
      { type: "SUB", id: sub?.id || "", contribId },
      i18n.t("share_message_sub")
    );
    platform.openTgLink(url);
  };

  const myContrib = sub?.contribs.find((v) => v.userId === user.id);
  const isCreator = sub?.createdById === user.id;
  const isParticipant = myContrib ? true : false;

  function getJoinContribId() {
    if (!shortContribId) return null;
    if (!sub) return null;
    if (isParticipant) return null;
    if (isLoading) return null;
    const contrib = sub.contribs.find((v) => v.id.startsWith(shortContribId));
    return contrib?.id || null;
  }

  if (!sub) {
    if (!error) return null;
    return <ErrorPage error={error} />;
  }

  return (
    <Context.Provider
      value={{
        sub,
        isCreator,
        isParticipant,
        hasEnded: sub.endDate ? isBeforeOrEqualToToday(sub.endDate) : false,
        tab,
        setTab,
        copyUrl,
        invalidate,
        isLoading,
        updateReminder: updateReminderMutation.mutate,
      }}
    >
      <ContribsProvider
        value={{
          id: sub.id,
          joinContribId: getJoinContribId(),
          creatorId: sub.createdById,
          isCreator: isCreator,
          isParticipant: isParticipant,
          isVisible: calcIsPublic({
            createdAt: sub.createdAt,
            visibility: sub.visibility,
          }),
          amount: sub.amount,
          currencyCode: sub.currencyCode,
          contribs: sub.contribs,
          copyUrl,
          isLoading,
          joinMutation: joinMutation,
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
      isLoading={joinMutation.isLoading}
    />
  );
};
