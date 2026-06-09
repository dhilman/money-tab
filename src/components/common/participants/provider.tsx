import { createContext, useContext } from "react";
import type {
  ParticipantsDispatch,
  ParticipantsState,
  SplitMode,
} from "~/components/common/participants/reducer";
import { useGroups } from "~/components/provider/users-provider";
import type { Currency } from "~/lib/amount/currencies";

interface UserContrib {
  userId: string | null;
  amountPaid: number;
  amountOwed: number;
  manualAmountOwed: boolean;
}

interface Context extends ParticipantsState {
  currency: Currency;
  setPayerId: (id: string) => void;
  addNewParticipant: () => void;
  toggleParticipant: (id: string, groupId?: string) => void;
  toggleGroup: (groupId: string) => void;
  setSplitMode: (mode: SplitMode) => void;
  setSplitValue: (id: string, value: number) => void;
  resetSplitValue: (id: string) => void;
  /** Batch-write per-party itemized totals (from the receipt bridge) in one reducer pass. */
  applyItemizedTotals: (totals: { id: string; amount: number }[]) => void;
  getContribs: () => UserContrib[];
  getGroupId: () => string | null;
}

const ParticipantsContext = createContext<Context | null>(null);

export function useParticipantsCtx() {
  const ctx = useContext(ParticipantsContext);
  if (!ctx)
    throw new Error(
      "useParticipantsCtx must be used within ParticipantsProvider",
    );
  return ctx;
}

interface Props {
  currency: Currency;
  state: ParticipantsState;
  update: ParticipantsDispatch;
  children: React.ReactNode;
}

export const ParticipantsProvider = ({
  currency,
  state,
  update,
  children,
}: Props) => {
  const groups = useGroups();

  const getContribs = (): UserContrib[] => {
    const isItemized = state.splitMode === "itemized";
    return state.parties.map((p) => ({
      userId: p.type === "user" ? p.id : null,
      amountPaid: p.id === state.payerId ? state.total : 0,
      amountOwed: isItemized ? p.splitItemized.value : p.amount,
      manualAmountOwed: isItemized ? false : p.splitAmount.manual,
    }));
  };

  return (
    <ParticipantsContext.Provider
      value={{
        ...state,
        currency,
        setPayerId: (id) => update({ type: "set_payer", id }),
        addNewParticipant: () => update({ type: "add_new" }),
        toggleParticipant: (id, groupId) =>
          update({ type: "toggle", id, groupId }),
        toggleGroup: (groupId) => {
          if (state.groupId === groupId) {
            update({ type: "remove_group", groupId });
            return;
          }
          const group = groups.find((g) => g.id === groupId);
          update({
            type: "add_group",
            groupId,
            userIds: group?.memberIds || [],
          });
        },
        setSplitMode: (mode) => update({ type: "set_split_mode", mode }),
        setSplitValue: (id, value) =>
          update({
            type: "set_split_value",
            id,
            value,
            mode: state.splitMode,
          }),
        resetSplitValue: (id) =>
          update({ type: "reset_split_value", id, mode: state.splitMode }),
        applyItemizedTotals: (totals) =>
          update({ type: "apply_itemized_totals", totals }),
        getContribs,
        getGroupId: () => state.groupId || null,
      }}
    >
      {children}
    </ParticipantsContext.Provider>
  );
};
