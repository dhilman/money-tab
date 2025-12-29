import { Avatar } from "~/components/ui/avatar";
import type { BaseGroup } from "~/lib/consts/types";

interface GroupAvatarProps {
  className?: string;
  size?: React.ComponentProps<typeof Avatar>["size"];
  group: BaseGroup;
}

export function GroupAvatar({ className, size, group }: GroupAvatarProps) {
  return (
    <Avatar
      className={className}
      size={size}
      src={group.photoUrl}
      initials={Array.from(group.name)[0] ?? ""}
      colorId={group.accentColorId ?? 0}
    />
  );
}
