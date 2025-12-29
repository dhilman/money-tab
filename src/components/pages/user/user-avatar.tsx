import React, { useMemo } from "react";
import { Avatar } from "~/components/ui/avatar";
import type { BaseUser } from "~/lib/consts/types";

interface UserAvatarProps {
  className?: string;
  size?: React.ComponentProps<typeof Avatar>["size"];
  user: BaseUser;
}

export function UserAvatar({ className, size, user }: UserAvatarProps) {
  const initials = useUserInitials(user);
  return (
    <Avatar
      src={user.photoUrl}
      size={size}
      className={className}
      initials={initials}
      colorId={user.accentColorId ?? 0}
    />
  );
}

interface UserAvatarOrPlaceholderProps {
  className?: string;
  size?: React.ComponentProps<typeof Avatar>["size"];
  user: BaseUser | null;
  initials?: string;
  accentColorId?: number;
  accentHash?: string;
}

export function UserAvatarOrPlaceholder({
  className,
  size,
  user,
  initials,
  accentColorId,
  accentHash,
}: UserAvatarOrPlaceholderProps) {
  if (user) return <UserAvatar className={className} size={size} user={user} />;

  const colorId =
    accentColorId || (accentHash ? getColorFromString(accentHash) : 0);

  return (
    <Avatar
      size={size}
      className={className}
      src={null}
      initials={initials || "?"}
      colorId={colorId}
    />
  );
}

function useUserInitials(user: BaseUser) {
  return useMemo(() => {
    if (user.nickname) {
      return user.nickname.charAt(0);
    }
    if (user.firstName || user.lastName) {
      return (
        (user.firstName?.charAt(0) || "") + (user.lastName?.charAt(0) || "")
      );
    }
    return user.username?.charAt(0) || "";
  }, [user]);
}

function getColorFromString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }
  return Math.abs(hash) % 7;
}
