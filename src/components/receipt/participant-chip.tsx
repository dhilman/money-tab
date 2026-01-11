"use client";

import { CheckIcon } from "lucide-react";
import { UserAvatarOrPlaceholder } from "~/components/pages/user/user-avatar";
import { useUser } from "~/components/provider/users-provider";
import { cn } from "~/lib/utils";

interface ParticipantChipProps {
  userId: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * Toggleable avatar chip for assigning participants to receipt items.
 * Selected state shows checkmark overlay, unselected is muted.
 */
export const ParticipantChip = ({
  userId,
  selected,
  onToggle,
  disabled,
}: ParticipantChipProps) => {
  const user = useUser(userId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full transition-all",
        "touch-manipulation select-none", // Improves touch responsiveness
        selected ? "ring-2 ring-primary ring-offset-1" : "opacity-40",
        disabled && "pointer-events-none",
      )}
    >
      <UserAvatarOrPlaceholder size="sm" user={user} accentHash={userId} />
      {selected && (
        <div className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white pointer-events-none">
          <CheckIcon className="h-2.5 w-2.5" />
        </div>
      )}
    </button>
  );
};

interface ParticipantChipGroupProps {
  participantIds: string[];
  selectedIds: string[];
  onToggle: (userId: string) => void;
  disabled?: boolean;
}

/**
 * Group of participant chips for item assignment.
 */
export const ParticipantChipGroup = ({
  participantIds,
  selectedIds,
  onToggle,
  disabled,
}: ParticipantChipGroupProps) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {participantIds.map((userId) => (
        <ParticipantChip
          key={userId}
          userId={userId}
          selected={selectedIds.includes(userId)}
          onToggle={() => onToggle(userId)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};
