import type { BaseUser } from "~/lib/consts/types";

type MockUsers<T extends string> = Record<T, BaseUser>;

export const mockUsers: MockUsers<"alice" | "bob" | "charlie"> = {
  alice: {
    id: "alice",
    firstName: "Alice",
    lastName: "Smith",
    accentColorId: 1,
    photoUrl: null,
    username: "alice",
    nickname: null,
  },
  bob: {
    id: "bob",
    firstName: "Bob",
    lastName: "Johnson",
    accentColorId: 2,
    photoUrl: null,
    username: "bob",
    nickname: null,
  },
  charlie: {
    id: "charlie",
    firstName: "Charlie",
    lastName: "Brown",
    accentColorId: 3,
    photoUrl: null,
    username: "charlie",
    nickname: null,
  },
};
