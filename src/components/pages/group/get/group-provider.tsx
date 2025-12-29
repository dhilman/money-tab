import { createContext, useContext } from "react";
import { ErrorPage } from "~/components/pages/error";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { type RouterOutputs, api } from "~/utils/api";

type Group = RouterOutputs["group"]["get"];

interface Context {
  group: Group;
  subs: RouterOutputs["user"]["start"]["subscriptions"];
  isLoading: boolean;
}

const Context = createContext<Context | null>(null);

export const useGroupCtx = () => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useGroupCtx must be used within a GroupProvider");
  }
  return ctx;
};

interface Props {
  shortId: string;
  children: React.ReactNode;
}

export const GroupProvider = ({ shortId, children }: Props) => {
  const placeholder = usePlaceholderData(shortId);
  const { subscriptions } = useProfile();
  const { data, error, isPlaceholderData } = api.group.get.useQuery(shortId, {
    enabled: !!shortId,
    placeholderData: placeholder,
  });

  if (error) return <ErrorPage error={error} />;
  if (!data) return null;

  return (
    <Context.Provider
      value={{
        group: data,
        subs: subscriptions.filter((s) => s.groupId === data.id),
        isLoading: isPlaceholderData,
      }}
    >
      {children}
    </Context.Provider>
  );
};

const PLACEHODLER: Group = {
  id: "",
  name: "",
  accentColorId: 0,
  archivedAt: null,
  isMember: false,
  isAdmin: false,
  createdAt: "",
  telegramId: null,
  photoUrl: null,
  createdById: "",
  tgChatType: null,
  tgLinked: false,
  memberships: [],
};

const usePlaceholderData = (id: string) => {
  const ctx = api.useUtils();
  const start = ctx.user.start.getData();
  return {
    ...PLACEHODLER,
    ...start?.groups.find((v) => v.id === id),
  };
};
