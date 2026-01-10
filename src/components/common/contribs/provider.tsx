import { createContext, useContext } from "react";

interface Contrib {
  id: string;
  userId: string | null;
  amountPaid: number;
  amountOwed: number;
  status: "CONFIRMED" | "PENDING" | "NOT_DELIVERED";
}

export type ContribsContext = {
  id: string;
  joinContribId: string | null;
  creatorId: string;
  isCreator: boolean;
  isParticipant: boolean;
  isVisible: boolean;
  amount: number;
  currencyCode: string;
  contribs: Contrib[];
  copyUrl: (contribId?: string) => void;
  joinMutation: {
    isPending: boolean;
    mutate: (contribId: string) => void;
  };
  isLoading: boolean;
};

const Context = createContext<ContribsContext | null>(null);

export const ContribsProvider = Context.Provider;

export const useContribsCtx = () => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useContribsCtx must be used within a ContribsProvider");
  }
  return ctx;
};
