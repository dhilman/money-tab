import { PencilIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGroupCtx } from "~/components/pages/group/get/group-provider";
import { useWebAppRouter } from "~/components/router/router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface GroupDropdownProps {
  children: React.ReactNode;
}

export const GroupDropdown = ({ children }: GroupDropdownProps) => {
  const { t } = useTranslation();
  const router = useWebAppRouter();
  const { group } = useGroupCtx();

  if (!group) return null;
  if (!group.isMember) return null;
  if (!group.isAdmin) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() =>
            void router.push({
              pathname: "/webapp/group/[id]/edit",
              query: { id: group.id },
            })
          }
          className="justify-between text-foreground"
        >
          {t("edit")}
          <PencilIcon className="h-4 w-4 shrink-0" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
