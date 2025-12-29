import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";
import { AuthScreen } from "~/components/provider/auth/auth-screen";
import {
  cacheProfile,
  getPlaceholderProfile,
} from "~/components/provider/auth/user-cache";
import { usePlatform } from "~/components/provider/platform/context";
import i18n from "~/lib/i18n";
import { changeLocale } from "~/lib/locale";
import { getTgWebAppShareUrl } from "~/lib/url/share-url";
import type { RouterInputs, RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { toMap } from "~/utils/map";

type Profile = RouterOutputs["user"]["start"];
type Contact = RouterOutputs["user"]["start"]["connections"][number];
type UpdateUser = RouterInputs["user"]["update"];
type ProfileInvalidate = (fn?: (input: Profile) => Profile) => void;

export type Account = "personal" | "shared";

type Context = Profile & {
  currencyCode: string;
  account: Account;
  contactsById: Map<string, Contact>;
  isRegistered: boolean;
  isLoading: boolean;
  register: () => Promise<boolean>;
  setAccount: (account: Account) => void;
  updateUser: (input: UpdateUser) => void;
  invalidate: ProfileInvalidate;
};

const Context = createContext<Context | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [account, setAccount] = useState<Account>("personal");
  const ctx = api.useUtils();
  const { data, error, isRegistered, updateUser, isLoading, register } =
    useStartApi();

  const invalidate = useCallback(
    (fn?: (input: Profile) => Profile) => {
      if (fn) {
        ctx.user.start.setData(undefined, (v) => (v ? fn(v) : v));
      }
      void ctx.user.start.invalidate();
    },
    [ctx.user.start]
  );

  if (error) return <AuthScreen />;
  if (!data) return null;

  function getCurrencyCode() {
    if (isLoading) return "USD";
    if (data?.user.currencyCode) return data.user.currencyCode;
    const [tx] = data?.transactions ?? [];
    if (tx?.currencyCode) return tx.currencyCode;
    const [sub] = data?.subscriptions ?? [];
    if (sub?.currencyCode) return sub.currencyCode;
    return "USD";
  }

  return (
    <Context.Provider
      value={{
        ...data,
        currencyCode: getCurrencyCode(),
        account,
        setAccount,
        contactsById: toMap(data.connections, "id"),
        updateUser,
        isRegistered,
        register,
        isLoading,
        invalidate,
      }}
    >
      {children}
    </Context.Provider>
  );
};

function useStartApi() {
  // We use state for isRegistered as when the user activates the bot
  // through webapp, it might take a second for TG webhooks
  // to go through, so we just assume they did and set this to true.
  const [isRegistered, setIsRegistered] = useState(true);

  const ctx = api.useUtils();
  const platform = usePlatform();
  const { data, error, isPlaceholderData } = api.user.start.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
      placeholderData: () => getPlaceholderProfile(),
    }
  );

  const updateUserMutation = api.user.update.useMutation({
    onError: () => {
      toast.error(i18n.t("error.generic"));
      void ctx.user.start.invalidate();
    },
  });

  const updateUser = (input: UpdateUser) => {
    ctx.user.start.setData(undefined, (data) => {
      if (!data) return data;
      return { ...data, user: { ...data.user, ...input } };
    });
    updateUserMutation.mutate(input);
  };

  useEffect(() => {
    if (!data) return;

    if (data.user.languageCode === "ru") {
      void changeLocale("ru");
    }

    cacheProfile(data);
  }, [data]);

  useEffect(() => {
    if (!data?.user.id) return;
    if (data.user.isRegistered !== isRegistered) {
      setIsRegistered(data.user.isRegistered);
    }
  }, [isRegistered, data?.user]);

  // TODO: analytics.identify(data.user.id);
  // useEffect(() => {
  //   if (data?.user?.id) {
  //   }
  // }, [data?.user?.id]);

  async function register() {
    if (isRegistered) return true;
    const res = await platform.register();
    if (res) {
      ctx.user.start.setData(undefined, (data) => {
        if (!data) return data;
        return { ...data, user: { ...data.user, isRegistered: true } };
      });
    }
    return res;
  }

  return {
    data,
    error,
    isRegistered,
    updateUser,
    isLoading: isPlaceholderData,
    register,
  };
}

export function useProfile() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useProfile must be used within a AuthProvider");
  }
  return context;
}

export const useShareProfile = () => {
  const platform = usePlatform();
  const { user } = useProfile();

  return () => {
    const url = getTgWebAppShareUrl(
      { type: "USER", id: user.id },
      i18n.t("share_message_profile")
    );
    platform.openTgLink(url);
  };
};

export function useMe() {
  const { user } = useProfile();
  return user;
}

export function useContacts() {
  const { connections } = useProfile();
  return connections;
}
