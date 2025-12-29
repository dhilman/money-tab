import {
  TonConnectUIProvider,
  toUserFriendlyAddress,
  useTonAddress,
  useTonConnectUI,
} from "@tonconnect/ui-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { env } from "~/env.mjs";
import { copyToClipboard } from "~/lib/clipboard";
import { useRefLatest } from "~/lib/hooks";

interface Props {
  children: React.ReactNode;
}

type ConnectStatus = "CONNECTED" | "BROKEN" | "NOT_CONNECTED";

interface Context {
  disconnect: () => void;
  copy: () => void;
  connect: () => void;
  friendlyShort: string;
  status: ConnectStatus;
}

const WalletContext = createContext<Context | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

const MANIFEST_URL = `${env.NEXT_PUBLIC_BASE_URL}/tonconnect-manifest.json`;

export function WalletProvider({ children }: Props) {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      <InnerProvider>{children}</InnerProvider>
    </TonConnectUIProvider>
  );
}

function InnerProvider({ children }: Props) {
  const { user, updateUser } = useProfile();
  const [ton] = useTonConnectUI();
  const tonAddress = useTonAddress();
  const userTonAddress = useRefLatest(user.tonAddress);

  const { address, status } = useMemo(() => {
    if (tonAddress) {
      return {
        address: tonAddress,
        status: "CONNECTED" as const,
      };
    }
    if (user.tonAddress) {
      return {
        address: toUserFriendlyAddress(user.tonAddress),
        status: "BROKEN" as const,
      };
    }
    return { address: "", status: "NOT_CONNECTED" as const };
  }, [user.tonAddress, tonAddress]);

  useEffect(() => {
    const offStatusChange = ton.onStatusChange((wallet) => {
      if (!wallet) return;
      const address = wallet.account.address;
      if (!address) return;
      if (address === userTonAddress.current) return;
      updateUser({ tonAddress: address });
    });
    return () => offStatusChange();
  }, [ton, updateUser, userTonAddress]);

  const disconnect = useCallback(() => {
    void ton.disconnect().then(() => {
      updateUser({ tonAddress: null });
    });
  }, [ton, updateUser]);

  return (
    <WalletContext.Provider
      value={{
        disconnect,
        copy: () =>
          void copyToClipboard({ title: "TON Address", url: address }),
        connect: () => void ton.openModal(),
        friendlyShort: address.slice(0, 4) + "..." + address.slice(-4),
        status,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
