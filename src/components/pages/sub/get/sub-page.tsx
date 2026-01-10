import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { Contributions } from "~/components/common/contribs/contribution";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { SubDropdown } from "~/components/pages/sub/get/sub-dropdown";
import { SubHeader } from "~/components/pages/sub/get/sub-header";
import { SubMeta } from "~/components/pages/sub/get/sub-meta";
import {
  useSubCtx,
  type SubPageTab,
} from "~/components/pages/sub/get/sub-provider";
import { SubDetails } from "~/components/pages/sub/get/sub-spend";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export const SubPage = () => {
  return (
    <WebAppMain className="flex flex-col gap-6">
      <SubDropdown>
        <button className="absolute top-4 right-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-hint/10">
            <DotsVerticalIcon className="h-5 w-5 text-hint" />
          </div>
        </button>
      </SubDropdown>
      <SubHeader />
      <SubMeta />
      <StatusDeleted />
      <SubTabs />
      <div />
    </WebAppMain>
  );
};

const SubTabs = () => {
  const { t } = useTranslation();
  const { sub, tab, setTab, isParticipant } = useSubCtx();

  if (sub.contribs.length === 1 && isParticipant) {
    return (
      <div className="flex w-full flex-col items-center gap-6">
        <SubDetails />
      </div>
    );
  }

  return (
    <Tabs
      defaultValue="details"
      className="w-full space-y-6"
      value={tab}
      onValueChange={(v) => setTab(v as SubPageTab)}
    >
      <Bento>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">{t("details")}</TabsTrigger>
          <TabsTrigger value="contribs">{t("participants")}</TabsTrigger>
        </TabsList>
      </Bento>
      <TabsContent
        value="details"
        className="flex w-full flex-col items-center gap-6"
      >
        <SubDetails />
      </TabsContent>
      <TabsContent value="contribs" className="w-full">
        <Contributions headerHidden />
      </TabsContent>
    </Tabs>
  );
};

const StatusDeleted = () => {
  const { sub } = useSubCtx();
  if (sub.archivedAt === null) return null;

  return (
    <Bento>
      <BentoContent className="p-4">
        <div className="text-lg text-hint">
          Status:
          <span className="font-medium text-foreground"> Deleted</span>
        </div>
        <div className="mt-1 text-sm text-hint">
          This subscription has been deleted and will no longer be visible.
        </div>
      </BentoContent>
    </Bento>
  );
};
