import { useEffect } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import { formatUserName } from "~/components/pages/user/user-name";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { type BaseUser } from "~/lib/consts/types";
import { api, type RouterOutputs } from "~/utils/api";

type ApiUser = RouterOutputs["user"]["get"];
type ApiGroup = RouterOutputs["group"]["list"][number];

export type User = ApiUser & {
  name: string;
  me?: boolean;
};
type Group = Omit<ApiGroup, "members">;
type Updater<T> = ((v: T) => T) | Partial<T>;

function applyUpdate<T>(v: T, update: Updater<T>) {
  if (typeof update === "function") {
    return update(v);
  }
  return { ...v, ...update };
}

interface State {
  usersById: Map<string, User>;
  groups: Group[];
}

interface Actions {
  setUser: (user: ApiUser) => void;
  updateUser: (id: string, update: Updater<User>) => void;
  setGroup: (group: Group) => void;
  updateGroup: (id: string, update: Updater<Group>) => void;
}

export const userStore = create<State & Actions>((set) => ({
  usersById: new Map(),
  groups: [],
  setUser: (user) =>
    set((state) => {
      const newUsersById = new Map(state.usersById);
      newUsersById.set(user.id, addNameToUser(user));
      return { usersById: newUsersById };
    }),
  updateUser: (id, update) =>
    set((state) => {
      const user = state.usersById.get(id);
      if (!user) return state;
      const updated = applyUpdate(user, update);
      const newUsersById = new Map(state.usersById);
      newUsersById.set(id, updated);
      return { usersById: newUsersById };
    }),
  updateGroup: (id, update) =>
    set((state) => {
      const group = state.groups.find((g) => g.id === id);
      if (!group) return state;
      const updated = applyUpdate(group, update);
      const newGroups = [...state.groups];
      const index = newGroups.findIndex((g) => g.id === id);
      newGroups[index] = updated;
      return { groups: newGroups };
    }),
  setGroup: (group) =>
    set((state) => {
      const newGroups = [...state.groups];
      const index = newGroups.findIndex((g) => g.id === group.id);
      if (index === -1) {
        newGroups.push(group);
      } else {
        newGroups[index] = group;
      }
      return { groups: newGroups };
    }),
}));

export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
  const { user: me, connections, groups } = useProfile();
  const { data: groupsWithMembers } = api.group.list.useQuery(undefined, {
    enabled: groups.length === 0,
  });

  useEffect(() => {
    const state = userStore.getState();
    const usersById = new Map(state.usersById);

    connections.forEach((connection) => {
      usersById.set(connection.id, addNameToUser(connection));
    });
    usersById.set(
      me.id,
      addNameToUser({ ...me, nickname: null, connected: true, me: true })
    );

    groupsWithMembers?.forEach((group) => {
      group.members.forEach((member) => {
        if (usersById.has(member.id)) return;
        usersById.set(
          member.id,
          addNameToUser({ ...member, nickname: null, connected: false })
        );
      });
    });

    userStore.setState({ usersById, groups: groupsWithMembers ?? [] });
  }, [me, connections, groupsWithMembers]);

  return <>{children}</>;
};

function addNameToUser(user: Omit<User, "name">): User {
  return {
    ...user,
    name: formatUserName(user),
  };
}

export function useAddUsersToIndex(users?: (BaseUser | null)[]) {
  useEffect(() => {
    if (!users) return;
    const state = userStore.getState();
    const newUsers = users.filter((v) => v && !state.usersById.has(v.id));
    if (newUsers.length === 0) return;
    const newUsersById = new Map(state.usersById);
    newUsers.forEach((user) => {
      if (!user) return;
      newUsersById.set(
        user.id,
        addNameToUser({ ...user, nickname: null, connected: false })
      );
    });
    userStore.setState({ usersById: newUsersById });
  }, [users]);
}

export function useUser(id: string | null) {
  const user = userStore((state) => (id ? state.usersById.get(id) : null));
  if (!user) return null;
  return user;
}

export function useUsersByIds(ids: (string | null)[]) {
  const users = userStore(
    useShallow((state) =>
      ids.map((id) => (id ? state.usersById.get(id) : null))
    )
  );
  return users.filter((v) => !!v);
}

export function useUserWithApi(shortUserId: string) {
  const updateUser = userStore((state) => state.updateUser);
  const user = userStore((state) => {
    if (shortUserId.length < 5) return null;
    const users = state.usersById.values();
    for (const user of users) {
      if (user.id.startsWith(shortUserId)) return user;
    }
    return null;
  });
  const { data: userFromApi, error } = api.user.get.useQuery(shortUserId, {
    enabled: !user,
    placeholderData: {
      id: "",
      nickname: null,
      connected: true,
      username: null,
      firstName: null,
      lastName: null,
      photoUrl: null,
      accentColorId: null,
    },
  });
  useEffect(() => {
    if (!userFromApi) return;
    userStore.getState().setUser(userFromApi);
  }, [userFromApi]);

  return { user, error, updateUser };
}

export function useGroups() {
  return userStore((state) => state.groups);
}
