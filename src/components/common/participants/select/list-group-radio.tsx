import { useTranslation } from "react-i18next";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { GroupAvatar } from "~/components/pages/group/group-avatar";
import { useMe } from "~/components/provider/auth/auth-provider";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import { ListUserRadio } from "./list-user-radio";
import { RadioCheck } from "./radio-check";

interface Props {
  group: {
    id: string;
    name: string;
    memberIds: string[];
    photoUrl: string | null;
    accentColorId: number | null;
  };
}

export const ListGroupRadio = ({ group }: Props) => {
  const me = useMe();
  const { t } = useTranslation();
  const {
    groupId: selectedGroupId,
    groupLocked,
    parties,
    toggleGroup,
    toggleParticipant,
  } = useParticipantsCtx();
  const selected = selectedGroupId === group.id;
  const memberIds = group.memberIds.filter((id) => id !== me.id);
  if (groupLocked && !selected) return null;

  return (
    <>
      <ListItem
        as="button"
        onClick={() => !groupLocked && toggleGroup(group.id)}
      >
        <ListItemLeft>
          <GroupAvatar group={group} size="xl" />
        </ListItemLeft>
        <ListItemBody>
          <div className="w-full">
            <div className="truncate font-medium text-ellipsis">
              {group.name}
            </div>
            <div className="text-hint text-sm">
              {t("n_members", { count: group.memberIds.length })}
            </div>
          </div>
          <RadioCheck selected={selected} disabled={groupLocked} />
        </ListItemBody>
      </ListItem>
      {selected && (
        <div className="flex flex-col gap-2">
          {memberIds.map((id) => (
            <ListUserRadio
              key={id}
              className="pl-10"
              userId={id}
              selected={selected && parties.some((p) => p.id === id)}
              onToggle={() => toggleParticipant(id, group.id)}
            />
          ))}
        </div>
      )}
    </>
  );
};
