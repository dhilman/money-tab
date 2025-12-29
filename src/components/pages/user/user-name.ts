interface UserNames {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  nickname?: string | null;
}

export function formatUserName(user?: UserNames | null) {
  if (!user) {
    return "";
  }
  if (user.nickname) {
    return user.nickname;
  }
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  if (name) {
    return name;
  }
  if (user.username) {
    return `@${user.username}`;
  }
  return "";
}
