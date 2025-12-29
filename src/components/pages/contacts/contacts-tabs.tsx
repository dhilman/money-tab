import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
import { GroupAvatar } from "~/components/pages/group/group-avatar";
import { UserWithBalance } from "~/components/pages/user/user-with-balance";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { MyLink } from "~/components/router/link";
import { useTypedQuery, useWebAppRouter } from "~/components/router/router";
import {
  AnimatedImage,
  AnimatedImageContainer,
} from "~/components/ui/animated-image";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { RouterOutputs } from "~/utils/api";

export const ContactsTabs = () => {
  const { tab } = useTypedQuery("/webapp/contacts");
  const router = useWebAppRouter();
  const { t } = useTranslation();

  return (
    <Bento>
      <Tabs
        defaultValue={tab ?? "contacts"}
        className="w-full space-y-3"
        onValueChange={(tab) =>
          void router.replace({
            pathname: "/webapp/contacts",
            query: { tab: tab as "contacts" | "groups" },
          })
        }
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contacts">{t("contacts")}</TabsTrigger>
          <TabsTrigger value="groups">{t("groups")}</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts" className="w-full">
          <TabContentContacts />
        </TabsContent>
        <TabsContent value="groups" className="w-full">
          <TabContentGroups />
        </TabsContent>
      </Tabs>
    </Bento>
  );
};

const TabContentContacts = () => {
  const { t } = useTranslation();
  const { connections } = useProfile();

  if (connections.length === 0) {
    return (
      <div className="flex w-full flex-col items-center px-7 pb-8 pt-4">
        <AnimatedImageContainer>
          <AnimatedImage name="bust" />
        </AnimatedImageContainer>
        <div className="mt-2.5 text-center text-base font-semibold">
          {t("your_contacts_will_appear_here")}
        </div>
      </div>
    );
  }

  return (
    <List>
      {connections.map((u) => (
        <UserWithBalance key={u.id} userId={u.id} />
      ))}
    </List>
  );
};

const TabContentGroups = () => {
  const { t } = useTranslation();
  const { groups } = useProfile();

  if (groups.length === 0) {
    return (
      <div className="flex w-full flex-col items-center px-7 pb-8 pt-4">
        <AnimatedImageContainer>
          <AnimatedImage name="busts" />
        </AnimatedImageContainer>
        <div className="mt-2.5 text-center text-base font-semibold">
          {t("your_groups_will_appear_here")}
        </div>
      </div>
    );
  }

  return (
    <List>
      {groups.map((g) => (
        <GroupListItem key={g.id} group={g} />
      ))}
    </List>
  );
};

interface GroupListItemProps {
  group: RouterOutputs["user"]["start"]["groups"][number];
}

const GroupListItem = ({ group }: GroupListItemProps) => {
  return (
    <ListItem
      as={MyLink}
      route={{ pathname: "/webapp/group/[id]", query: { id: group.id } }}
    >
      <ListItemLeft>
        <GroupAvatar size="xl" group={group} />
      </ListItemLeft>
      <ListItemBody className="text-base font-medium">
        <div className="truncate">{group.name}</div>
      </ListItemBody>
    </ListItem>
  );
};
