import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
} from "react";
import { type Attachment } from "~/components/form/file-input";
import { type Currency } from "~/lib/amount/currencies";

export type TxEditScreen = "main" | "edit_users" | "edit_payer" | "currency";

interface Context {
  type: "create" | "edit";

  screen: TxEditScreen;
  setScreen: (screen: TxEditScreen) => void;

  amount: number;
  setAmount: (amount: number) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  description: string;
  setDescription: (description: string) => void;
  date: string;
  setDate: (date: string) => void;
  time: string;
  setTime: (time: string) => void;
  files: Attachment[];
  setFiles: Dispatch<SetStateAction<Attachment[]>>;
}

export const TxEditContext = createContext<Context | null>(null);

export function useTxEditCtx() {
  const ctx = useContext(TxEditContext);
  if (!ctx) {
    throw new Error("useTxEditCtx must be used within a TxEditProvider");
  }
  return ctx;
}
