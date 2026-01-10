import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import type { ReminderLeadTime } from "~/lib/dates/dates";
import { type MyContext } from "~/server/api/trpc";
import { toMap, toMapWithValue } from "~/utils/map";

interface Contrib {
  id: string;
  userId: string | null;
  amountPaid: number;
  amountOwed: number;
  manualAmountOwed: boolean;
  status?: "CONFIRMED" | "NOT_DELIVERED";
}

type NewContrib = Omit<Contrib, "id">;
type ContribUpdate<T extends Contrib> = Partial<T> & { id: string };

type ContribEventType = "join" | "leave" | "amount_update";

interface ContribEvent {
  type: ContribEventType;
  userId: string;
  newUser?: boolean;
}

export interface ContribsChangeset<T extends Contrib> {
  creates: NewContrib[];
  updates: ContribUpdate<T>[];
  deletes: string[];
  events: ContribEvent[];
}
export type TxChangeset = ContribsChangeset<Contrib>;
export type SubChangeset = ContribsChangeset<SubContrib>;

interface ResolveParams<T extends Contrib> {
  old: T[];
  new: NewContrib[];
}

/**
 * Contributions resolver constructs a changeset for contributions
 * - Uses userId to resolve contributions
 * - Unassigned contributions currently always get deleted and re-added,
 * as FE doesn't pass the id
 */
abstract class ContribsResolver<T extends Contrib> {
  changeset: ContribsChangeset<T> = {
    creates: [],
    updates: [],
    deletes: [],
    events: [],
  };
  oldMap: Map<string, T>;
  newMap: Map<string, NewContrib>;

  constructor(params: ResolveParams<T>) {
    const oldUserIdToId = toMapWithValue(
      params.old,
      // Using v.id as fallback -> this means unassigned will get re-created
      (v) => v.userId || v.id,
      (v) => v.id,
    );
    this.oldMap = toMap(params.old, "id");
    this.newMap = toMap(params.new, (v) => {
      if (!v.userId) return createId();
      return oldUserIdToId.get(v.userId) || createId();
    });
  }

  resolve(): ContribsChangeset<T> {
    this.handleDeletions();
    this.handleAdditions();
    this.handleUpdates();
    return this.changeset;
  }

  private handleDeletions() {
    this.oldMap.forEach((c, id) => {
      if (this.newMap.has(id)) return;

      this.changeset.deletes.push(id);
      if (c.userId) {
        this.event("leave", c.userId);
      }
    });
  }

  private handleAdditions() {
    this.newMap.forEach((c, id) => {
      if (this.oldMap.has(id)) return;

      this.changeset.creates.push(c);
      if (c.userId) {
        this.event("join", c.userId, true);
      }
    });
  }

  private handleUpdates() {
    this.newMap.forEach((c, id) => {
      const old = this.oldMap.get(id);
      if (!old) return; // handled in addition

      this.checkDoUpdate(c, old);
    });
  }

  abstract checkDoUpdate(c: NewContrib, old: T): void;

  event(type: ContribEventType, userId: string, newUser?: boolean) {
    this.changeset.events.push({ type, userId, newUser });
  }
}

class TxContribsResolver extends ContribsResolver<Contrib> {
  checkDoUpdate(c: NewContrib, old: Contrib) {
    if (
      c.userId === old.userId &&
      c.amountOwed === old.amountOwed &&
      c.amountPaid === old.amountPaid &&
      c.manualAmountOwed === old.manualAmountOwed
    ) {
      // No changes
      return;
    }

    this.changeset.updates.push({
      id: old.id,
      amountPaid: firstWhenChanged(c.amountPaid, old.amountPaid),
      amountOwed: firstWhenChanged(c.amountOwed, old.amountOwed),
      manualAmountOwed: firstWhenChanged(
        c.manualAmountOwed,
        old.manualAmountOwed,
      ),
    });

    c.userId && this.event("amount_update", c.userId);
  }
}

interface SubContrib extends Contrib {
  reminder: ReminderLeadTime | null;
  reminderDate: string | null;
}

interface SubContribResolveParams extends ResolveParams<SubContrib> {
  getReminderDate: (c: SubContrib) => string | null;
}

class SubContribsResolver extends ContribsResolver<SubContrib> {
  getReminderDate: (c: SubContrib) => string | null;

  constructor(params: SubContribResolveParams) {
    super(params);
    this.getReminderDate = params.getReminderDate;
  }

  checkDoUpdate(c: NewContrib, old: SubContrib) {
    const newReminderDate = this.getReminderDate(old);
    if (
      c.userId === old.userId &&
      c.amountOwed === old.amountOwed &&
      c.amountPaid === old.amountPaid &&
      c.manualAmountOwed === old.manualAmountOwed &&
      newReminderDate === old.reminderDate
    ) {
      // No changes
      return;
    }

    this.changeset.updates.push({
      id: old.id,
      amountPaid: firstWhenChanged(c.amountPaid, old.amountPaid),
      amountOwed: firstWhenChanged(c.amountOwed, old.amountOwed),
      manualAmountOwed: firstWhenChanged(
        c.manualAmountOwed,
        old.manualAmountOwed,
      ),
      reminderDate: firstWhenChanged(newReminderDate, old.reminderDate),
    });

    // Amount updated when reminder wasn't
    if (c.userId && newReminderDate === old.reminderDate) {
      this.event("amount_update", c.userId);
    }
  }
}

export function resolveTxChanges(
  params: ResolveParams<Contrib>,
): ContribsChangeset<Contrib> {
  return new TxContribsResolver(params).resolve();
}

export function resolveSubChanges(
  params: SubContribResolveParams,
): ContribsChangeset<SubContrib> {
  return new SubContribsResolver(params).resolve();
}

function firstWhenChanged<T>(newVal: T, old: T): T | undefined {
  return newVal === old ? undefined : newVal;
}

export function joinChangeset(
  ctx: MyContext,
  params: {
    contribId: string;
    contribs: Contrib[];
    amount: number;
  },
): ContribsChangeset<Contrib> {
  if (params.contribs.some((c) => c.userId === ctx.userId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You are already a participant",
    });
  }

  const contrib = params.contribs.find((c) => c.id === params.contribId);
  if (!contrib) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid contribution",
    });
  }
  if (contrib.userId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User already assigned",
    });
  }

  return {
    updates: [
      {
        id: contrib.id,
        userId: ctx.userId,
        status: "CONFIRMED",
      },
    ],
    creates: [],
    deletes: [],
    events: [{ type: "join", userId: ctx.userId, newUser: true }],
  };
}

export function leaveChangeset(
  ctx: MyContext,
  params: {
    contribs: Contrib[];
    amount: number;
  },
): ContribsChangeset<Contrib> {
  const existing = params.contribs.find((c) => c.userId === ctx.userId);
  if (!existing) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You are not a participant",
    });
  }

  return {
    creates: [],
    updates: [{ id: existing.id, userId: null, status: "NOT_DELIVERED" }],
    deletes: [],
    events: [{ type: "leave", userId: ctx.userId }],
  };
}
