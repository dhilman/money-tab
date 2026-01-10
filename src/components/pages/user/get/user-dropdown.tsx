import { MessageCircleIcon, PencilIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUserCtx } from "~/components/pages/user/get/user-provider";
import { usePlatform } from "~/components/provider/platform/context";
import { useWebAppRouter } from "~/components/router/router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface UserDropdownProps {
  children: React.ReactNode;
}

export const UserDropdown = ({ children }: UserDropdownProps) => {
  const { t } = useTranslation();
  const platform = usePlatform();
  const router = useWebAppRouter();
  const { user } = useUserCtx();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="mt-1 w-56 text-base font-medium"
      >
        <DropdownMenuItem
          onSelect={() =>
            void router.push({
              pathname: "/webapp/user/[id]/edit",
              query: { id: user.id },
            })
          }
          className="text-foreground justify-between font-normal"
        >
          {t("edit")}
          <PencilIcon className="h-4 w-4 shrink-0" />
        </DropdownMenuItem>
        {user.username && (
          <DropdownMenuItem
            className="text-foreground justify-between"
            onSelect={() => {
              platform.openTgLink(`https://t.me/${user.username as string}`);
            }}
          >
            {t("open_chat")}
            <MessageCircleIcon className="h-4 w-4 shrink-0" />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
