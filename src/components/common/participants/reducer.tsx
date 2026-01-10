import { createId } from "@paralleldrive/cuid2";
import { useEffect, useReducer, useRef } from "react";
import { useGroups } from "~/components/provider/users-provider";
import { splitAmount } from "~/lib/amount/split-amount";

export interface Participant {
  type: "user" | "new";
  id: string;
  groupId?: string;
  amount: number;
  manual?: boolean;
}

interface State {
  meId: string;
  parties: Participant[];
  payerId: string;
  total: number;
  groupId: string;
  groupLocked?: boolean;
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
  | { type: "set_amount"; id: string; amount: number }
  | { type: "reset_amount"; id: string };

type Action =
  | PartiesAction
  | { type: "recalculate"; total: number }
  | { type: "set_payer"; id: string };
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
      manual: c.manualAmountOwed,
    })),
    payerId: payer?.userId || payer?.id || params.meId,
    groupId: params.groupId || "",
    groupLocked: !!params.groupId,
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
    if (p.manual !== orig.manualAmountOwed) return true;
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
        parties: partiesReducer(parties, action),
      };
      break;
    }
    case "remove_group":
      newState = {
        ...state,
        groupId: "",
        parties: partiesReducer(state.parties, action),
      };
      break;
    default:
      newState = {
        ...state,
        parties: partiesReducer(state.parties, action),
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
): Participant[] {
  switch (action.type) {
    case "add":
      return [...arr, newParticipant(action.id, "user", action.groupId)];
    case "add_group":
      return arr.concat(
        action.userIds
          .filter((id) => !arr.some((p) => p.id === id))
          .map((id) => ({
            type: "user",
            id,
            amount: 0,
            groupId: action.groupId,
          })),
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
    case "set_amount":
      return arr.map((p) =>
        p.id === action.id ? { ...p, manual: true, amount: action.amount } : p,
      );
    case "reset_amount":
      return arr.map((p) =>
        p.id === action.id ? { ...p, manual: false, amount: 0 } : p,
      );
  }
}

function newParticipant(
  id: string,
  type: "user" | "new" = "user",
  groupId?: string,
): Participant {
  return { type, id, amount: 0, groupId };
}

function recalculate(state: State): State {
  const amounts = state.parties.reduce(
    (acc, p) => {
      if (p.manual) return { ...acc, manual: acc.manual + p.amount };
      if (p.amount === 0) return { ...acc, zero: acc.zero + 1 };
      return { ...acc, auto: acc.auto + p.amount };
    },
    { auto: 0, manual: 0, zero: 0 },
  );

  if (amounts.manual > state.total) {
    return {
      ...state,
      invalid: true,
    };
  }

  // We only need to recalculate the rest if either:
  // 1. any non manual has amount 0
  // 2. total manual !== remaining
  if (amounts.zero === 0 && amounts.manual + amounts.auto === state.total) {
    return state;
  }

  const remaining = state.total - amounts.manual;
  const numDefault = state.parties.filter((p) => !p.manual).length;
  const splits = splitAmount(remaining, numDefault);
  return {
    ...state,
    invalid: false,
    parties: state.parties.map((p) =>
      p.manual ? p : { ...p, amount: splits.pop() ?? 0 },
    ),
  };
}
