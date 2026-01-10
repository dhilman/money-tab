import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { ArchiveIcon, LogOutIcon, PencilIcon, ShareIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTx } from "~/components/pages/tx/get/tx-provider";
import { useWebAppRouter } from "~/components/router/router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export const TxDropdown = () => {
  const { t } = useTranslation();
  const router = useWebAppRouter();
  const { tx, onArchiveTx, onLeaveTx, copyTxUrl } = useTx();

  if (!tx.isParticipant) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="absolute top-4 right-4">
          <div className="bg-hint/10 flex h-9 w-9 items-center justify-center rounded-full">
            <DotsVerticalIcon className="text-hint h-5 w-5" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => copyTxUrl()}>
            {t("share_link")}
            <ShareIcon className="ml-auto h-4 w-4" />
          </DropdownMenuItem>
          {tx.isCreator && tx.status !== "ARCHIVED" && (
            <>
              <DropdownMenuItem
                onSelect={() =>
                  router.push({
                    pathname: "/webapp/tx/[id]/edit",
                    query: { id: tx.id },
                  })
                }
              >
                {t("edit")}
                <PencilIcon className="ml-auto h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500" onSelect={onArchiveTx}>
                {t("archive")}
                <ArchiveIcon className="ml-auto h-4 w-4" />
              </DropdownMenuItem>
            </>
          )}
          {!tx.isCreator && tx.isParticipant && (
            <DropdownMenuItem className="text-red-500" onSelect={onLeaveTx}>
              {t("leave")}
              <LogOutIcon className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
