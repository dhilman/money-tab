import { createId } from "@paralleldrive/cuid2";
import { useEffect, useReducer, useRef } from "react";
import { useGroups } from "~/components/provider/users-provider";
import { splitAmount } from "~/lib/amount/split-amount";

export type SplitMode = "amount" | "percentage" | "shares";

export interface SplitValue {
  value: number;
  manual: boolean;
}

export interface Participant {
  type: "user" | "new";
  id: string;
  groupId?: string;
  amount: number;
  splitAmount: SplitValue;
  splitPercentage: SplitValue;
  splitShares: SplitValue;
}

interface State {
  meId: string;
  parties: Participant[];
  payerId: string;
  total: number;
  groupId: string;
  groupLocked?: boolean;
  splitMode: SplitMode;
  invalid: boolean;
}
export type ParticipantsState = State;

type PartiesAction =
  | { type: "add"; id: string; groupId?: string }
  | { type: "add_new" }
  | { type: "toggle"; id: string; groupId?: string }
  | { type: "add_group"; groupId: string; userIds: string[] }
  | { type: "remove_group"; groupId: string }
  | { type: "remove"; id: string }
  | { type: "set_split_value"; id: string; value: number; mode: SplitMode }
  | { type: "reset_split_value"; id: string; mode: SplitMode };

type Action =
  | PartiesAction
  | { type: "recalculate"; total: number }
  | { type: "set_payer"; id: string }
  | { type: "set_split_mode"; mode: SplitMode };
export type ParticipantsDispatch = (action: Action) => void;

interface Params {
  amount: number;
  meId: string;
  startUserId: string | null;
  startGroupId: string | null;
}

export function useParticipantsReducer(params: Params) {
  const groups = useGroups();
  const [state, dispatch] = useReducer(
    reducer,
    {
      total: params.amount,
      meId: params.meId,
      parties: [],
      payerId: params.meId,
      groupId: "",
      splitMode: "amount" as SplitMode,
      invalid: false,
    },
    (state) => {
      const parties = [newParticipant(state.meId, "user")];
      if (params.startUserId) {
        parties.push(newParticipant(params.startUserId, "user"));
      }
      return { ...state, parties };
    },
  );

  const hasInitGroup = useRef(false);
  useEffect(() => {
    if (hasInitGroup.current) return;
    if (!params.startGroupId) return;
    const group = groups.find((g) => g.id === params.startGroupId);
    if (!group) return;
    dispatch({
      type: "add_group",
      groupId: group.id,
      userIds: group.memberIds,
    });
    hasInitGroup.current = true;
  }, [params.startGroupId, groups]);

  useEffect(() => {
    dispatch({ type: "recalculate", total: params.amount });
  }, [params.amount]);

  return [state, dispatch] as const;
}

interface EditParams {
  amount: number;
  contribs: {
    id: string;
    userId: string | null;
    amountPaid: number;
    amountOwed: number;
    manualAmountOwed: boolean;
  }[];
  groupId: string | null;
  meId: string;
}

export function useParticipantsEditReducer(params: EditParams) {
  const payer = params.contribs.find((c) => c.amountPaid > 0);
  const [state, dispatch] = useReducer(reducer, {
    total: params.amount,
    meId: params.meId,
    parties: params.contribs.map((c) => ({
      type: c.userId ? ("user" as const) : ("new" as const),
      id: c.userId || c.id,
      amount: c.amountOwed,
      splitAmount: { value: c.amountOwed, manual: c.manualAmountOwed },
      splitPercentage: { value: 0, manual: false },
      splitShares: { value: 1, manual: false },
    })),
    payerId: payer?.userId || payer?.id || params.meId,
    groupId: params.groupId || "",
    groupLocked: !!params.groupId,
    splitMode: "amount" as SplitMode,
    invalid: false,
  });

  useEffect(() => {
    dispatch({ type: "recalculate", total: params.amount });
  }, [params.amount]);

  return [state, dispatch] as const;
}

export function isParticipantsEdited(
  contribs: EditParams["contribs"],
  state: State,
) {
  const origPayer = contribs.find((c) => c.amountPaid > 0);
  const origPayerId = origPayer?.userId || origPayer?.id;
  if (state.payerId !== origPayerId) return true;

  if (contribs.length !== state.parties.length) return true;

  return state.parties.some((p, i) => {
    const orig = contribs[i];
    if (!orig) return true;
    const userId = p.type === "user" ? p.id : null;
    if (userId !== orig.userId) return true;
    if (p.amount !== orig.amountOwed) return true;
    if (p.splitAmount.manual !== orig.manualAmountOwed) return true;
  });
}

function reducer(state: State, action: Action): State {
  let newState: State;

  switch (action.type) {
    case "recalculate":
      newState = { ...state, total: action.total };
      break;
    case "set_payer":
      newState = { ...state, payerId: action.id };
      break;
    case "set_split_mode":
      newState = { ...state, splitMode: action.mode };
      break;
    case "add_group": {
      if (state.groupId === action.groupId) {
        return state;
      }
      let parties = state.parties;
      // Group being changed, remove all participants from old group
      // Doesn't effect self as never assigned a groupId
      if (state.groupId) {
        parties = parties.filter((p) => p.groupId !== state.groupId);
      }
      newState = {
        ...state,
        groupId: action.groupId,
        parties: partiesReducer(parties, action, state.splitMode),
      };
      break;
    }
    case "remove_group":
      newState = {
        ...state,
        groupId: "",
        parties: partiesReducer(state.parties, action, state.splitMode),
      };
      break;
    default:
      newState = {
        ...state,
        parties: partiesReducer(state.parties, action, state.splitMode),
      };
  }

  if (!newState.parties.some((p) => p.id === newState.payerId)) {
    newState.payerId = newState.meId;
  }

  return recalculate(newState);
}

function partiesReducer(
  arr: Participant[],
  action: PartiesAction,
  _splitMode: SplitMode,
): Participant[] {
  switch (action.type) {
    case "add":
      return [...arr, newParticipant(action.id, "user", action.groupId)];
    case "add_group":
      return arr.concat(
        action.userIds
          .filter((id) => !arr.some((p) => p.id === id))
          .map((id) => newParticipant(id, "user", action.groupId)),
      );
    case "add_new":
      return [...arr, newParticipant(createId(), "new")];
    case "toggle": {
      const exists = arr.some((p) => p.id === action.id);
      if (exists) {
        return arr.filter((p) => p.id !== action.id);
      }
      return [...arr, newParticipant(action.id, "user", action.groupId)];
    }
    case "remove":
      return arr.filter((p) => p.id !== action.id);
    case "remove_group":
      return arr.filter((p) => p.groupId !== action.groupId);
    case "set_split_value":
      return arr.map((p) => {
        if (p.id !== action.id) return p;
        switch (action.mode) {
          case "amount":
            return {
              ...p,
              splitAmount: { value: action.value, manual: true },
            };
          case "percentage":
            return {
              ...p,
              splitPercentage: { value: action.value, manual: true },
            };
          case "shares":
            return {
              ...p,
              splitShares: { value: action.value, manual: true },
            };
        }
      });
    case "reset_split_value":
      return arr.map((p) => {
        if (p.id !== action.id) return p;
        switch (action.mode) {
          case "amount":
            // Set amount: 0 so recalculation detects this participant needs a fresh value
            return {
              ...p,
              amount: 0,
              splitAmount: { value: 0, manual: false },
            };
          case "percentage":
            return {
              ...p,
              splitPercentage: { value: 0, manual: false },
            };
          case "shares":
            return {
              ...p,
              splitShares: { value: 1, manual: false },
            };
        }
      });
  }
}

function newParticipant(
  id: string,
  type: "user" | "new" = "user",
  groupId?: string,
): Participant {
  return {
    type,
    id,
    amount: 0,
    groupId,
    splitAmount: { value: 0, manual: false },
    splitPercentage: { value: 0, manual: false },
    splitShares: { value: 1, manual: false },
  };
}

function recalculate(state: State): State {
  switch (state.splitMode) {
    case "amount":
      return recalculateAmount(state);
    case "percentage":
      return recalculatePercentage(state);
    case "shares":
      return recalculateShares(state);
  }
}

function recalculateAmount(state: State): State {
  const amounts = state.parties.reduce(
    (acc, p) => {
      if (p.splitAmount.manual)
        return { ...acc, manual: acc.manual + p.splitAmount.value };
      if (p.amount === 0) return { ...acc, zero: acc.zero + 1 };
      return { ...acc, auto: acc.auto + p.amount };
    },
    { auto: 0, manual: 0, zero: 0 },
  );

  if (amounts.manual > state.total) {
    return {
      ...state,
      invalid: true,
      parties: state.parties.map((p) => ({
        ...p,
        amount: p.splitAmount.manual ? p.splitAmount.value : p.amount,
      })),
    };
  }

  // We only need to recalculate the rest if either:
  // 1. any non manual has amount 0
  // 2. total manual !== remaining
  if (amounts.zero === 0 && amounts.manual + amounts.auto === state.total) {
    return {
      ...state,
      invalid: false,
      parties: state.parties.map((p) => ({
        ...p,
        amount: p.splitAmount.manual ? p.splitAmount.value : p.amount,
        // Update splitAmount.value for non-manual participants so UI shows calculated value
        splitAmount: p.splitAmount.manual
          ? p.splitAmount
          : { value: p.amount, manual: false },
      })),
    };
  }

  const remaining = state.total - amounts.manual;
  const numDefault = state.parties.filter((p) => !p.splitAmount.manual).length;
  const splits = splitAmount(remaining, numDefault);
  return {
    ...state,
    invalid: false,
    parties: state.parties.map((p) => {
      if (p.splitAmount.manual) {
        return { ...p, amount: p.splitAmount.value };
      }
      const newAmount = splits.pop() ?? 0;
      return {
        ...p,
        amount: newAmount,
        splitAmount: { value: newAmount, manual: false },
      };
    }),
  };
}

function recalculatePercentage(state: State): State {
  // Percentages are stored as integers (e.g., 50 = 50%, 2550 = 25.50%)
  // We use basis points (100 = 1%) for precision
  const PERCENTAGE_SCALE = 100; // 10000 = 100%

  const totals = state.parties.reduce(
    (acc, p) => {
      if (p.splitPercentage.manual) {
        return { ...acc, manual: acc.manual + p.splitPercentage.value };
      }
      return { ...acc, autoCount: acc.autoCount + 1 };
    },
    { manual: 0, autoCount: 0 },
  );

  // Invalid if manual percentages exceed 100%
  if (totals.manual > 100 * PERCENTAGE_SCALE) {
    return {
      ...state,
      invalid: true,
      parties: state.parties.map((p) => ({
        ...p,
        amount: Math.round(
          (state.total * p.splitPercentage.value) / (100 * PERCENTAGE_SCALE),
        ),
      })),
    };
  }

  const remainingPercentage = 100 * PERCENTAGE_SCALE - totals.manual;
  const autoPercentage =
    totals.autoCount > 0
      ? Math.floor(remainingPercentage / totals.autoCount)
      : 0;

  // Distribute remainder for rounding
  const remainder =
    totals.autoCount > 0 ? remainingPercentage % totals.autoCount : 0;
  let remainderToDistribute = remainder;

  return {
    ...state,
    invalid: false,
    parties: state.parties.map((p) => {
      let percentage: number;
      if (p.splitPercentage.manual) {
        percentage = p.splitPercentage.value;
      } else {
        percentage = autoPercentage;
        if (remainderToDistribute > 0) {
          percentage += 1;
          remainderToDistribute--;
        }
      }
      const amount = Math.round(
        (state.total * percentage) / (100 * PERCENTAGE_SCALE),
      );
      // Update splitPercentage.value for non-manual participants so UI shows calculated value
      return {
        ...p,
        amount,
        splitPercentage: p.splitPercentage.manual
          ? p.splitPercentage
          : { value: percentage, manual: false },
      };
    }),
  };
}

function recalculateShares(state: State): State {
  const totalShares = state.parties.reduce(
    (sum, p) => sum + p.splitShares.value,
    0,
  );

  if (totalShares === 0) {
    return {
      ...state,
      invalid: false,
      parties: state.parties.map((p) => ({ ...p, amount: 0 })),
    };
  }

  // Calculate amounts based on share ratios
  const amounts = state.parties.map((p) =>
    Math.floor((state.total * p.splitShares.value) / totalShares),
  );

  // Distribute remainder
  const distributed = amounts.reduce((sum, a) => sum + a, 0);
  let remainder = state.total - distributed;

  // Give remainder to participants with highest share values first
  const indices = state.parties
    .map((p, i) => ({ i, shares: p.splitShares.value }))
    .sort((a, b) => b.shares - a.shares);

  for (const { i } of indices) {
    if (remainder <= 0) break;
    amounts[i] = (amounts[i] ?? 0) + 1;
    remainder--;
  }

  return {
    ...state,
    invalid: false,
    parties: state.parties.map((p, i) => ({ ...p, amount: amounts[i] ?? 0 })),
  };
}
