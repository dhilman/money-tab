import { describe, expect, test } from "vitest";
import {
  computePersonTotals,
  getInvolvedUsers,
  getUnassignedItems,
  splitAmountEvenly,
  splitAmountWeighted,
  validateTotals,
} from "./allocation";
import type { ExtraCharge, ItemAssignment, ReceiptItem } from "./types";

describe("splitAmountWeighted", () => {
  test("splits evenly when weights are equal", () => {
    const result = splitAmountWeighted(100, { a: 1, b: 1 });
    expect(result).toEqual({ a: 50, b: 50 });
  });

  test("splits by weight ratio 1:2", () => {
    const result = splitAmountWeighted(100, { a: 1, b: 2 });
    expect(result.a).toBe(33);
    expect(result.b).toBe(67);
    expect(result.a! + result.b!).toBe(100);
  });

  test("handles remainder cents with three-way split", () => {
    const result = splitAmountWeighted(10, { a: 1, b: 1, c: 1 });
    // 10 / 3 = 3.33... each, so we get 3+3+3=9, remainder 1
    // One person gets the extra cent
    const values = Object.values(result);
    expect(values.reduce((a, b) => a + b, 0)).toBe(10);
    expect(values.filter((v) => v === 4).length).toBe(1);
    expect(values.filter((v) => v === 3).length).toBe(2);
  });

  test("handles uneven weights with remainder", () => {
    const result = splitAmountWeighted(100, { a: 1, b: 1, c: 1 });
    // 100 / 3 = 33.33... each
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  test("handles zero weight entries by ignoring them", () => {
    const result = splitAmountWeighted(100, { a: 1, b: 0, c: 1 });
    expect(result.a).toBe(50);
    expect(result.b).toBeUndefined();
    expect(result.c).toBe(50);
  });

  test("returns empty object for empty weights", () => {
    const result = splitAmountWeighted(100, {});
    expect(result).toEqual({});
  });

  test("returns empty object when all weights are zero", () => {
    const result = splitAmountWeighted(100, { a: 0, b: 0 });
    expect(result).toEqual({});
  });

  test("handles single participant", () => {
    const result = splitAmountWeighted(100, { a: 1 });
    expect(result).toEqual({ a: 100 });
  });

  test("handles large weights correctly", () => {
    const result = splitAmountWeighted(1000, { a: 10, b: 20, c: 70 });
    expect(result.a).toBe(100);
    expect(result.b).toBe(200);
    expect(result.c).toBe(700);
  });

  test("prioritizes larger weight for remainder tie-break", () => {
    // 7 cents split between a:2 and b:1
    // a gets 4.67 (floor 4), b gets 2.33 (floor 2) = 6, remainder 1
    // Both have remainder 0.67 and 0.33, so a (higher remainder) gets it
    const result = splitAmountWeighted(7, { a: 2, b: 1 });
    expect(result.a! + result.b!).toBe(7);
  });
});

describe("splitAmountEvenly", () => {
  test("splits evenly among two people", () => {
    const result = splitAmountEvenly(100, ["a", "b"]);
    expect(result).toEqual({ a: 50, b: 50 });
  });

  test("handles remainder with three people", () => {
    const result = splitAmountEvenly(10, ["a", "b", "c"]);
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    expect(sum).toBe(10);
  });

  test("returns empty for empty user list", () => {
    const result = splitAmountEvenly(100, []);
    expect(result).toEqual({});
  });
});

describe("getInvolvedUsers", () => {
  test("returns unique users from assignments", () => {
    const assignments: ItemAssignment[] = [
      { itemId: "1", shares: { a: 1, b: 1 } },
      { itemId: "2", shares: { b: 1, c: 1 } },
    ];
    const result = getInvolvedUsers(assignments);
    expect(result.sort()).toEqual(["a", "b", "c"]);
  });

  test("ignores zero-weight entries", () => {
    const assignments: ItemAssignment[] = [
      { itemId: "1", shares: { a: 1, b: 0 } },
    ];
    const result = getInvolvedUsers(assignments);
    expect(result).toEqual(["a"]);
  });

  test("returns empty array for no assignments", () => {
    const result = getInvolvedUsers([]);
    expect(result).toEqual([]);
  });
});

describe("getUnassignedItems", () => {
  test("finds items with no assignments", () => {
    const items: ReceiptItem[] = [
      { id: "1", name: "Item 1", total: 100 },
      { id: "2", name: "Item 2", total: 200 },
      { id: "3", name: "Item 3", total: 300 },
    ];
    const assignments: ItemAssignment[] = [
      { itemId: "1", shares: { a: 1 } },
      { itemId: "3", shares: { b: 1 } },
    ];
    const result = getUnassignedItems(items, assignments, ["a", "b"]);
    expect(result).toEqual([{ id: "2", name: "Item 2", total: 200 }]);
  });

  test("treats zero-share assignments as unassigned", () => {
    const items: ReceiptItem[] = [{ id: "1", name: "Item 1", total: 100 }];
    const assignments: ItemAssignment[] = [
      { itemId: "1", shares: { a: 0, b: 0 } },
    ];
    const result = getUnassignedItems(items, assignments, ["a", "b"]);
    expect(result).toEqual([{ id: "1", name: "Item 1", total: 100 }]);
  });

  test("returns all items when no assignments", () => {
    const items: ReceiptItem[] = [
      { id: "1", name: "Item 1", total: 100 },
      { id: "2", name: "Item 2", total: 200 },
    ];
    const result = getUnassignedItems(items, [], ["a"]);
    expect(result).toEqual(items);
  });

  test("ignores shares that point to non-current participants", () => {
    const items: ReceiptItem[] = [{ id: "1", name: "Item 1", total: 100 }];
    const assignments: ItemAssignment[] = [
      { itemId: "1", shares: { stale_user: 1 } },
    ];
    // Stale assignment shouldn't count — item is effectively unassigned.
    expect(getUnassignedItems(items, assignments, ["a"])).toEqual(items);
  });
});

describe("computePersonTotals", () => {
  const items: ReceiptItem[] = [
    { id: "1", name: "Pizza", total: 2000 }, // $20
    { id: "2", name: "Salad", total: 1000 }, // $10
  ];

  test("computes totals for simple even split", () => {
    const assignments: ItemAssignment[] = [
      { itemId: "1", shares: { a: 1, b: 1 } },
      { itemId: "2", shares: { a: 1, b: 1 } },
    ];
    const result = computePersonTotals(items, assignments, [], ["a", "b"]);

    expect(result.find((p) => p.userId === "a")?.total).toBe(1500);
    expect(result.find((p) => p.userId === "b")?.total).toBe(1500);
  });

  test("computes totals with weighted shares", () => {
    const assignments: ItemAssignment[] = [
      { itemId: "1", shares: { a: 1, b: 2 } }, // a: 667, b: 1333
      { itemId: "2", shares: { a: 1 } }, // a: 1000
    ];
    const result = computePersonTotals(items, assignments, [], ["a", "b"]);

    const aTotal = result.find((p) => p.userId === "a")?.total ?? 0;
    const bTotal = result.find((p) => p.userId === "b")?.total ?? 0;

    expect(aTotal + bTotal).toBe(3000);
  });

  test("allocates tax proportionally to subtotal", () => {
    const assignments: ItemAssignment[] = [
      { itemId: "1", shares: { a: 1 } }, // a gets full $20
      { itemId: "2", shares: { b: 1 } }, // b gets full $10
    ];
    const extras: ExtraCharge[] = [
      {
        id: "tax",
        label: "Tax",
        amount: 300, // $3 tax
        method: { type: "proportional_to_subtotal" },
      },
    ];
    const result = computePersonTotals(items, assignments, extras, ["a", "b"]);

    // a paid $20 of $30 subtotal = 2/3 of tax = $2
    // b paid $10 of $30 subtotal = 1/3 of tax = $1
    expect(result.find((p) => p.userId === "a")?.extrasTotal).toBe(200);
    expect(result.find((p) => p.userId === "b")?.extrasTotal).toBe(100);
  });

  test("allocates tip evenly among involved", () => {
    const assignments: ItemAssignment[] = [
      { itemId: "1", shares: { a: 1, b: 1 } },
    ];
    const extras: ExtraCharge[] = [
      {
        id: "tip",
        label: "Tip",
        amount: 400,
        method: { type: "even_among_involved" },
      },
    ];
    const result = computePersonTotals(items, assignments, extras, [
      "a",
      "b",
      "c",
    ]);

    // Only a and b are involved, so they split $4 tip evenly
    expect(result.find((p) => p.userId === "a")?.extrasTotal).toBe(200);
    expect(result.find((p) => p.userId === "b")?.extrasTotal).toBe(200);
    // c is not involved in any items
    expect(result.find((p) => p.userId === "c")).toBeUndefined();
  });

  test("allocates service evenly among all", () => {
    const assignments: ItemAssignment[] = [
      { itemId: "1", shares: { a: 1 } }, // only a is involved
    ];
    const extras: ExtraCharge[] = [
      {
        id: "service",
        label: "Service",
        amount: 300,
        method: { type: "even_among_all" },
      },
    ];
    const result = computePersonTotals(items, assignments, extras, [
      "a",
      "b",
      "c",
    ]);

    // All 3 split the service charge evenly
    expect(result.find((p) => p.userId === "a")?.extrasTotal).toBe(100);
    expect(result.find((p) => p.userId === "b")?.extrasTotal).toBe(100);
    expect(result.find((p) => p.userId === "c")?.extrasTotal).toBe(100);
  });

  test("handles custom allocation", () => {
    const assignments: ItemAssignment[] = [
      { itemId: "1", shares: { a: 1, b: 1 } },
    ];
    const extras: ExtraCharge[] = [
      {
        id: "tip",
        label: "Tip",
        amount: 500,
        method: { type: "custom", shares: { a: 3, b: 2 } },
      },
    ];
    const result = computePersonTotals(items, assignments, extras, ["a", "b"]);

    // Custom 3:2 split of $5 tip
    expect(result.find((p) => p.userId === "a")?.extrasTotal).toBe(300);
    expect(result.find((p) => p.userId === "b")?.extrasTotal).toBe(200);
  });

  test("handles negative discount", () => {
    const assignments: ItemAssignment[] = [
      { itemId: "1", shares: { a: 1 } },
      { itemId: "2", shares: { b: 1 } },
    ];
    const extras: ExtraCharge[] = [
      {
        id: "discount",
        label: "Discount",
        amount: -300, // $3 off
        method: { type: "proportional_to_subtotal" },
      },
    ];
    const result = computePersonTotals(items, assignments, extras, ["a", "b"]);

    // a: $20 subtotal, gets 2/3 of -$3 = -$2
    // b: $10 subtotal, gets 1/3 of -$3 = -$1
    expect(result.find((p) => p.userId === "a")?.extrasTotal).toBe(-200);
    expect(result.find((p) => p.userId === "b")?.extrasTotal).toBe(-100);
  });
});

describe("validateTotals", () => {
  test("returns 0 when totals match", () => {
    const personTotals = [
      { userId: "a", itemsSubtotal: 1000, extrasTotal: 100, total: 1100 },
      { userId: "b", itemsSubtotal: 900, extrasTotal: 100, total: 1000 },
    ];
    expect(validateTotals(personTotals, 2100)).toBe(0);
  });

  test("returns positive when over", () => {
    const personTotals = [
      { userId: "a", itemsSubtotal: 1000, extrasTotal: 0, total: 1000 },
    ];
    expect(validateTotals(personTotals, 900)).toBe(100);
  });

  test("returns negative when under", () => {
    const personTotals = [
      { userId: "a", itemsSubtotal: 1000, extrasTotal: 0, total: 1000 },
    ];
    expect(validateTotals(personTotals, 1100)).toBe(-100);
  });

  test("handles empty totals", () => {
    expect(validateTotals([], 100)).toBe(-100);
  });
});
