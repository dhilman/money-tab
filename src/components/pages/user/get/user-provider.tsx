import { createContext, useContext } from "react";
import toast from "react-hot-toast";
import { ErrorPage } from "~/components/pages/error";
import { formatUserName } from "~/components/pages/user/user-name";
import { useProfile } from "~/components/provider/auth/auth-provider";
import {
  useUserWithApi,
  type User,
} from "~/components/provider/users-provider";
import { api, type RouterOutputs } from "~/utils/api";

type Context = {
  isSelf: boolean;
  user: User;
  txs: RouterOutputs["tx"]["listWithUser"]["txs"];
  balances: RouterOutputs["user"]["start"]["balances"];
  subs: RouterOutputs["user"]["start"]["subscriptions"];
  connectMutation: ReturnType<typeof api.user.connect.useMutation>;
  isContact: boolean;
  isLoading: boolean;
  isLoadingTxs: boolean;
};

const UserContext = createContext<Context | null>(null);

export const useUserCtx = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
};

interface Props {
  shortUserId: string;
  children: React.ReactNode;
}

export const UserProvider = ({ shortUserId, children }: Props) => {
  const { user, error, updateUser } = useUserWithApi(shortUserId);
  const { user: self, subscriptions, balances } = useProfile();
  const { data: txs, isLoading: txsLoading } = api.tx.listWithUser.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user }
  );
  const connectMutation = api.user.connect.useMutation({
    onSuccess: () => {
      if (!user) return;
      updateUser(user.id, { connected: true });
      toast.success("Connected!");
    },
    onError: () => {
      toast.error("Failed to connect");
    },
  });
  const subs = subscriptions.filter((s) => {
    if (!user) return false;
    return s.contribs.some((c) => c.userId === user.id);
  });

  if (!user) {
    if (error) return <ErrorPage error={error} />;
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        isSelf: self.id === user.id,
        user: { ...user, name: formatUserName(user) },
        txs: txs?.txs ?? [],
        balances: balances.filter((b) => b.userId === user.id),
        subs: subs,
        isContact: user.connected,
        connectMutation,
        // If a user ID is set, all the data needed is available (from start)
        isLoading: !user || user.id === "",
        isLoadingTxs: txsLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
