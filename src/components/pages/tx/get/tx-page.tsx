import { Bento, BentoContent } from "~/components/bento-box";
import { Contributions } from "~/components/common/contribs/contribution";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { TxActivity } from "~/components/pages/tx/get/tx-activity";
import { TxDropdown } from "~/components/pages/tx/get/tx-dropdown";
import { TxFiles } from "~/components/pages/tx/get/tx-files";
import { TxHeader } from "~/components/pages/tx/get/tx-header";
import { TxMeta } from "~/components/pages/tx/get/tx-header-date";
import { useTx } from "~/components/pages/tx/get/tx-provider";

export const TxPage = () => {
  return (
    <WebAppMain className="flex flex-col items-center gap-6">
      <TxDropdown />
      <TxHeader />
      <Status />
      <TxMeta />
      <TxFiles />
      <div className="-mt-4" />
      <Contributions />
      <div className="-mt-4" />
      <TxActivity />
    </WebAppMain>
  );
};

const Status = () => {
  const { tx } = useTx();
  if (tx.status !== "ARCHIVED") return null;
  return (
    <Bento>
      <BentoContent className="p-4">
        <div className="text-hint text-lg">
          Status:
          <span className="text-foreground font-medium"> Archived</span>
        </div>
        <div className="text-hint mt-1 text-sm">
          This transaction has been archived and is no longer visible in the
          overview.
        </div>
      </BentoContent>
    </Bento>
  );
};
