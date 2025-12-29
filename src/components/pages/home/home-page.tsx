import { ChevronRightIcon, NewspaperIcon, User2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
import { BottomTabs } from "~/components/common/bottom-tabs";
import { ClientComponent } from "~/components/common/client-component";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { HomeBalance } from "~/components/pages/home/home-balance";
import { ProfileNav } from "~/components/pages/home/home-nav";
import { SubListStatefull } from "~/components/pages/sub/list/sub-list";
import { TourStartListItem } from "~/components/pages/tour/tour";
import { TxListStatefull } from "~/components/pages/tx/list/tx-list";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { MyLink } from "~/components/router/link";
import {
  NewSubButton,
  NewTxButton,
  ShareButton,
} from "~/components/ui/buttons";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";

export const Home = () => {
  return (
    <div className="w-full bg-canvas">
      <ClientComponent>
        <ProfileNav className="py-4" />
      </ClientComponent>
      <WebAppMain className="flex w-full flex-col gap-7 pb-0 pt-0">
        <div className="flex flex-col gap-4">
          <HomeBalance />
        </div>
        <ActionButtons />
        <div className="w-full space-y-4">
          <TourStartListItem />
          <HomeLinks />
        </div>
        <HomeTabs />
      </WebAppMain>
    </div>
  );
};

const HomeLinks = () => {
  const { t } = useTranslation();
  return (
    <Bento>
      <List>
        <ListItem
          as={MyLink}
          route={{ pathname: "/webapp/contacts", query: { tab: "contacts" } }}
        >
          <ListItemLeft>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary">
              <User2Icon className="h-5 w-5 text-foreground" />
            </div>
          </ListItemLeft>
          <ListItemBody>
            <div className="text-base">{t("contacts_and_groups")}</div>
            <ChevronRightIcon className="ml-auto h-4 w-4 text-hint" />
          </ListItemBody>
        </ListItem>
        <ListItem as={MyLink} route={{ pathname: "/webapp/news" }}>
          <ListItemLeft>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary">
              <NewspaperIcon className="h-5 w-5 text-foreground" />
            </div>
          </ListItemLeft>
          <ListItemBody>
            <div className="text-base">{t("moneytab_blog")}</div>
            <ChevronRightIcon className="ml-auto h-4 w-4 text-hint" />
          </ListItemBody>
        </ListItem>
      </List>
    </Bento>
  );
};

const HomeTabs = () => {
  const { transactions: txs, isLoading, subscriptions: subs } = useProfile();

  return (
    <BottomTabs
      txs={<TxListStatefull isLoading={isLoading} txs={txs} />}
      subs={<SubListStatefull isLoading={isLoading} subs={subs} />}
    />
  );
};

const ActionButtons = () => {
  return (
    <Bento>
      <div className="grid w-full grid-cols-3 gap-2">
        <NewSubButton route={{ pathname: "/webapp/sub/create" }} />
        <NewTxButton route={{ pathname: "/webapp/tx/create" }} />
        <ShareButton />
      </div>
    </Bento>
  );
};
