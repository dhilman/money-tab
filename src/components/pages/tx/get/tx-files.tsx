import { useTranslation } from "react-i18next";
import { useTx } from "~/components/pages/tx/get/tx-provider";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";

export const TxFiles = () => {
  const { tx } = useTx();

  if (tx.files.length === 0) return null;

  return (
    <FilesDrawer>
      <div className="flex w-fit flex-wrap items-start gap-2 self-start px-4">
        {tx.files.map((f) => (
          <img
            key={f.id}
            src={f.url}
            alt="attachment"
            className="h-[84px] w-[84px] rounded-md border-[0.5px] border-hint/20 object-cover"
          />
        ))}
      </div>
    </FilesDrawer>
  );
};

interface DrawerProps {
  children: React.ReactNode;
}

const FilesDrawer = ({ children }: DrawerProps) => {
  const { t } = useTranslation();
  const { tx } = useTx();
  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="h-[calc(100vh-4rem)]" aria-describedby="files">
        <div className="flex w-full justify-center overflow-y-auto bg-background">
          <div className="min-h-screen w-full max-w-xl pb-12">
            <DrawerHeader className="pt-2">
              <DrawerTitle>{t("attachments")}</DrawerTitle>
            </DrawerHeader>
            <div className="flex w-full flex-col items-center justify-center gap-2 p-4">
              {tx.files.map((f) => (
                <img
                  key={f.id}
                  src={f.url}
                  alt="attachment"
                  className="h-fit w-full rounded-md bg-canvas/10 object-contain"
                />
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
