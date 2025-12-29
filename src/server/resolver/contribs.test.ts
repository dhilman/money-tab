import { describe, expect, test } from "vitest";
import { resolveTxChanges, type TxChangeset } from "~/server/resolver/contribs";

interface TestCase {
  desc: string;
  old: Parameters<typeof resolveTxChanges>[0]["old"];
  new: Parameters<typeof resolveTxChanges>[0]["new"];
  changeset: Partial<TxChangeset>;
}

function makeContrib(
  userId: string | null,
  amountPaid: number,
  amountOwed: number,
  manualAmountOwed = false
) {
  return { userId, amountPaid, amountOwed, manualAmountOwed };
}

function makeContribWithId(
  id: string,
  userId: string | null,
  amountPaid: number,
  amountOwed: number,
  manualAmountOwed = false
) {
  return { id, userId, amountPaid, amountOwed, manualAmountOwed };
}

describe("resolve contribs", () => {
  const testCases: TestCase[] = [
    {
      desc: "empty, no changes",
      old: [],
      new: [],
      changeset: {},
    },
    {
      desc: "empty to one new",
      old: [],
      new: [makeContrib("u1", 10, 10)],
      changeset: {
        creates: [makeContrib("u1", 10, 10)],
        events: [{ type: "join", userId: "u1", newUser: true }],
      },
    },
    {
      desc: "one to empty",
      old: [makeContribWithId("1", "u1", 10, 10)],
      new: [],
      changeset: {
        deletes: ["1"],
        events: [{ type: "leave", userId: "u1" }],
      },
    },
    {
      desc: "2 Users, 1 Unassigned -> 1 New, 1 Removed, 1 Updated, 1 Unassigned",
      old: [
        makeContribWithId("1", "u1", 10, 10),
        makeContribWithId("2", "u2", 10, 10),
        makeContribWithId("3", null, 10, 10),
      ],
      new: [
        makeContrib("u1", 20, 20, true),
        makeContrib("u3", 10, 10),
        makeContrib(null, 10, 10),
      ],
      changeset: {
        creates: [makeContrib("u3", 10, 10), makeContrib(null, 10, 10)],
        deletes: ["2", "3"],
        updates: [
          { id: "1", amountPaid: 20, amountOwed: 20, manualAmountOwed: true },
        ],
        events: [
          { type: "leave", userId: "u2" },
          { type: "join", userId: "u3", newUser: true },
          { type: "amount_update", userId: "u1" },
        ],
      },
    },
  ];

  testCases.forEach((tc) => {
    test(tc.desc, () => {
      const result = resolveTxChanges({ old: tc.old, new: tc.new });
      expect(result.creates).toEqual(tc.changeset.creates || []);
      expect(result.events).toEqual(tc.changeset.events || []);
      expect(result.updates).toEqual(tc.changeset.updates || []);
      expect(result.deletes).toEqual(tc.changeset.deletes || []);
    });
  });
});
