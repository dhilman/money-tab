import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bento, BentoHeader } from "~/components/bento-box";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { useContacts } from "~/components/provider/auth/auth-provider";
import { useGroups } from "~/components/provider/users-provider";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import { EmptyOptions } from "./empty-options";
import { ListGroupRadio } from "./list-group-radio";
import { ListUserRadio } from "./list-user-radio";

interface Props {
  el: "sub" | "tx";
}

export const ParticipantsSelect = ({ el }: Props) => {
  const { addNewParticipant } = useParticipantsCtx();

  return (
    <div className="flex w-full flex-col gap-4">
      <AddButton onClick={addNewParticipant} />
      <EmptyOptions el={el} className="py-8" />
      <NewContactsList />
      <ContactsList />
      <GroupsList />
    </div>
  );
};

const NewContactsList = () => {
  const { t } = useTranslation();
  const { parties, toggleParticipant } = useParticipantsCtx();
  const newContacts = parties.filter((p) => p.type === "new");

  if (newContacts.length === 0) return null;

  return (
    <Bento>
      <BentoHeader>{t("new_contacts")}</BentoHeader>
      <List>
        {newContacts.map((p) => (
          <ListUserRadio
            key={p.id}
            userId={p.id}
            selected={true}
            onToggle={() => toggleParticipant(p.id)}
          />
        ))}
      </List>
    </Bento>
  );
};

const ContactsList = () => {
  const { t } = useTranslation();
  const { parties, toggleParticipant } = useParticipantsCtx();
  const contacts = useContacts();

  if (contacts.length === 0) return null;

  return (
    <Bento>
      <BentoHeader>{t("contacts")}</BentoHeader>
      <List>
        {contacts.map((u) => (
          <ListUserRadio
            key={u.id}
            userId={u.id}
            selected={parties.some((p) => p.id === u.id)}
            onToggle={() => toggleParticipant(u.id)}
          />
        ))}
      </List>
    </Bento>
  );
};

const GroupsList = () => {
  const { t } = useTranslation();
  const groups = useGroups();

  if (groups.length === 0) return null;

  return (
    <Bento>
      <BentoHeader>{t("groups")}</BentoHeader>
      <List>
        {groups.map((group) => (
          <ListGroupRadio key={group.id} group={group} />
        ))}
      </List>
    </Bento>
  );
};

interface AddButtonProps {
  onClick: () => void;
}

const AddButton = ({ onClick }: AddButtonProps) => {
  const { t } = useTranslation();
  return (
    <Bento>
      <ListItem
        as="button"
        onClick={onClick}
        className="bg-background text-link"
      >
        <ListItemLeft className="pl-1.5">
          <PlusIcon />
        </ListItemLeft>
        <ListItemBody size="sm" className="border-0">
          {t("someone_new")}
        </ListItemBody>
      </ListItem>
    </Bento>
  );
};
