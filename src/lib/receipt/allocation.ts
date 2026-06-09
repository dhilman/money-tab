/**
 * Cents-safe allocation algorithms for receipt splitting.
 * All amounts are integers (cents) to avoid floating-point precision issues.
 */

import type {
  ExtraCharge,
  ItemAssignment,
  PersonTotal,
  ReceiptItem,
} from "./types";

/**
 * Split an amount proportionally by weights, handling remainder cents fairly.
 * Remainder cents go to participants with the largest weights first.
 *
 * @param amount - Total amount in cents to split
 * @param weights - Map of userId to weight (share count)
 * @returns Map of userId to their portion in cents
 *
 * @example
 * splitAmountWeighted(100, { a: 1, b: 1 }) // { a: 50, b: 50 }
 * splitAmountWeighted(100, { a: 1, b: 2 }) // { a: 33, b: 67 }
 * splitAmountWeighted(10, { a: 1, b: 1, c: 1 }) // { a: 4, b: 3, c: 3 }
 */
export function splitAmountWeighted(
  amount: number,
  weights: Record<string, number>,
): Record<string, number> {
  // Sort by userId so distribution is deterministic regardless of key order
  // (jsonb round-trips don't preserve object key order).
  const entries = Object.entries(weights)
    .filter(([, w]) => w > 0)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  if (entries.length === 0) {
    return {};
  }

  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  if (totalWeight === 0) {
    return {};
  }

  // Calculate base amounts and track remainders for fair distribution
  const result: Record<string, number> = {};
  let distributed = 0;

  // First pass: give everyone their floor share
  const remainders: Array<{
    userId: string;
    remainder: number;
    weight: number;
  }> = [];

  for (const [userId, weight] of entries) {
    const exactShare = (amount * weight) / totalWeight;
    const floorShare = Math.floor(exactShare);
    result[userId] = floorShare;
    distributed += floorShare;
    remainders.push({
      userId,
      remainder: exactShare - floorShare,
      weight,
    });
  }

  // Second pass: distribute remaining cents to those with largest remainders
  // Tie-break by weight (larger weight gets priority)
  let remaining = amount - distributed;
  remainders.sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder - a.remainder;
    }
    if (b.weight !== a.weight) {
      return b.weight - a.weight;
    }
    return a.userId < b.userId ? -1 : 1;
  });

  for (const { userId } of remainders) {
    if (remaining <= 0) break;
    result[userId]! += 1;
    remaining -= 1;
  }

  return result;
}

/**
 * Split an amount evenly among participants, handling remainder cents.
 *
 * @param amount - Total amount in cents
 * @param userIds - Array of user IDs to split among
 * @returns Map of userId to their portion in cents
 */
export function splitAmountEvenly(
  amount: number,
  userIds: string[],
): Record<string, number> {
  if (userIds.length === 0) {
    return {};
  }

  const weights: Record<string, number> = {};
  for (const userId of userIds) {
    weights[userId] = 1;
  }
  return splitAmountWeighted(amount, weights);
}

/**
 * Get list of user IDs who are involved in any item assignment.
 */
export function getInvolvedUsers(assignments: ItemAssignment[]): string[] {
  const users = new Set<string>();
  for (const assignment of assignments) {
    for (const userId of Object.keys(assignment.shares)) {
      if (assignment.shares[userId]! > 0) {
        users.add(userId);
      }
    }
  }
  return Array.from(users);
}

/**
 * Find items that have no current participant assigned.
 * Stale shares pointing to removed participants don't count as "assigned".
 */
export function getUnassignedItems(
  items: ReceiptItem[],
  assignments: ItemAssignment[],
  participantIds: string[],
): ReceiptItem[] {
  const validParticipants = new Set(participantIds);
  const assignedItemIds = new Set(
    assignments
      .filter((a) =>
        Object.entries(a.shares).some(
          ([uid, s]) => s > 0 && validParticipants.has(uid),
        ),
      )
      .map((a) => a.itemId),
  );

  return items.filter((item) => !assignedItemIds.has(item.id));
}

/**
 * Drop shares pointing at users who are no longer participants, so stale
 * assignments allocate fully to the remaining valid assignees.
 */
function filterSharesToParticipants(
  shares: Record<string, number>,
  validParticipants: Set<string>,
): Record<string, number> {
  const filtered: Record<string, number> = {};
  for (const [userId, share] of Object.entries(shares)) {
    if (validParticipants.has(userId)) {
      filtered[userId] = share;
    }
  }
  return filtered;
}

/**
 * Compute per-person totals from item assignments and extras.
 *
 * @param items - Receipt items
 * @param assignments - Item-to-participant assignments
 * @param extras - Extra charges (tax, tip, etc.)
 * @param allParticipantIds - All participant IDs (for "even_among_all" allocation)
 * @returns Array of per-person totals
 */
export function computePersonTotals(
  items: ReceiptItem[],
  assignments: ItemAssignment[],
  extras: ExtraCharge[],
  allParticipantIds: string[],
): PersonTotal[] {
  // Initialize totals for all participants
  const validParticipants = new Set(allParticipantIds);
  const totals: Record<string, { items: number; extras: number }> = {};
  for (const userId of allParticipantIds) {
    totals[userId] = { items: 0, extras: 0 };
  }

  // Build item lookup
  const itemById = new Map(items.map((i) => [i.id, i]));

  // Calculate item subtotals per person
  const personItemSubtotals: Record<string, number> = {};

  for (const assignment of assignments) {
    const item = itemById.get(assignment.itemId);
    if (!item) continue;

    const shares = splitAmountWeighted(
      item.total,
      filterSharesToParticipants(assignment.shares, validParticipants),
    );
    for (const [userId, amount] of Object.entries(shares)) {
      totals[userId]!.items += amount;
      personItemSubtotals[userId] = (personItemSubtotals[userId] ?? 0) + amount;
    }
  }

  // Get involved users for "even_among_involved" allocation
  const involvedUsers = getInvolvedUsers(assignments).filter((userId) =>
    validParticipants.has(userId),
  );

  // Calculate extras per person
  for (const extra of extras) {
    if (extra.amount === 0) continue;

    let shares: Record<string, number>;

    switch (extra.method.type) {
      case "proportional_to_subtotal": {
        // Split proportionally based on each person's item subtotal
        const weights: Record<string, number> = {};
        for (const userId of Object.keys(personItemSubtotals)) {
          weights[userId] = personItemSubtotals[userId] ?? 0;
        }
        shares = splitAmountWeighted(extra.amount, weights);
        break;
      }

      case "even_among_involved": {
        shares = splitAmountEvenly(extra.amount, involvedUsers);
        break;
      }

      case "even_among_all": {
        shares = splitAmountEvenly(extra.amount, allParticipantIds);
        break;
      }

      case "custom": {
        shares = splitAmountWeighted(
          extra.amount,
          filterSharesToParticipants(extra.method.shares, validParticipants),
        );
        break;
      }
    }

    for (const [userId, amount] of Object.entries(shares)) {
      totals[userId]!.extras += amount;
    }
  }

  // Convert to PersonTotal array
  return Object.entries(totals)
    .filter(([, t]) => t.items !== 0 || t.extras !== 0)
    .map(([userId, t]) => ({
      userId,
      itemsSubtotal: t.items,
      extrasTotal: t.extras,
      total: t.items + t.extras,
    }));
}

/**
 * Validate that person totals sum to the receipt total.
 *
 * @param personTotals - Computed per-person totals
 * @param receiptTotal - Expected receipt total in cents
 * @returns Difference (positive = over, negative = under, 0 = exact match)
 */
export function validateTotals(
  personTotals: PersonTotal[],
  receiptTotal: number,
): number {
  const sum = personTotals.reduce((acc, p) => acc + p.total, 0);
  return sum - receiptTotal;
}
