import {
  ArchiveIcon,
  EditIcon,
  LogOutIcon,
  RefreshCwOff,
  ShareIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useSubCtx } from "~/components/pages/sub/get/sub-provider";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { usePlatform } from "~/components/provider/platform/context";
import { useWebAppRouter } from "~/components/router/router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { getDateYYYYMMDD } from "~/lib/dates/dates";
import { api } from "~/utils/api";

interface SubDropdownProps {
  children: React.ReactNode;
}

export const SubDropdown = ({ children }: SubDropdownProps) => {
  const { t } = useTranslation();
  const { copyUrl, isParticipant } = useSubCtx();

  if (!isParticipant) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => copyUrl()}>
            {t("share_link")}
            <ShareIcon className="ml-auto h-4 w-4" />
          </DropdownMenuItem>
          <EditDrodownItem />
          <CancelDropdownItem />
          <ArchiveDropdownItem />
          <LeaveDropdownItem />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const EditDrodownItem = () => {
  const { t } = useTranslation();
  const router = useWebAppRouter();
  const { sub, isCreator } = useSubCtx();

  if (!isCreator) return null;

  return (
    <DropdownMenuItem
      onSelect={() =>
        router.push({
          pathname: "/webapp/sub/[id]/edit",
          query: { id: sub.id },
        })
      }
    >
      {t("edit")}
      <EditIcon className="ml-auto h-4 w-4" />
    </DropdownMenuItem>
  );
};

const CancelDropdownItem = () => {
  const { t } = useTranslation();
  const { sub, hasEnded, isCreator, invalidate } = useSubCtx();
  const platform = usePlatform();

  const mutation = api.sub.cancel.useMutation({
    onSuccess: () => {
      invalidate((prev) => {
        return {
          ...prev,
          renewalDate: undefined,
          endDate: getDateYYYYMMDD(new Date()),
        };
      });
      toast.success("Subscription cancelled");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  if (!isCreator || hasEnded) return null;

  return (
    <DropdownMenuItem
      className="text-orange-500"
      onSelect={async () => {
        const confirmed = await platform.confirmDialog(t("confirm.cancel_sub"));
        if (!confirmed) return;
        mutation.mutate({
          id: sub.id,
          endDate: getDateYYYYMMDD(new Date()),
        });
      }}
      disabled={mutation.isLoading}
    >
      {t("cancel")}
      <RefreshCwOff className="ml-auto h-4 w-4" />
    </DropdownMenuItem>
  );
};

const ArchiveDropdownItem = () => {
  const { t } = useTranslation();
  const { invalidate } = useProfile();
  const { sub, isCreator } = useSubCtx();
  const router = useWebAppRouter();
  const platform = usePlatform();
  const mutation = api.sub.archive.useMutation({
    onSuccess: () => {
      invalidate((v) => ({
        ...v,
        subscriptions: v.subscriptions.filter((s) => s.id !== sub.id),
      }));
      toast.success("Subscription archived");
      void router.replace({ pathname: "/webapp" });
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  if (!isCreator) return null;

  return (
    <DropdownMenuItem
      onSelect={async () => {
        const confirmed = await platform.confirmDialog(
          t("confirm.archive_sub")
        );
        if (!confirmed) return;
        mutation.mutate(sub.id);
      }}
      disabled={mutation.isLoading}
      className="text-red-500"
    >
      {t("archive")}
      <ArchiveIcon className="ml-auto h-4 w-4" />
    </DropdownMenuItem>
  );
};

const LeaveDropdownItem = () => {
  const { t } = useTranslation();
  const router = useWebAppRouter();
  const ctx = api.useUtils();
  const platform = usePlatform();
  const { sub, isCreator, isParticipant } = useSubCtx();

  const mutation = api.sub.leave.useMutation({
    onSuccess: () => {
      void ctx.user.start.invalidate();
      toast.success("Left subscription");
      void router.replace({ pathname: "/webapp" });
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  if (isCreator || !isParticipant) return null;

  return (
    <DropdownMenuItem
      className="text-red-500"
      onSelect={async () => {
        const confirmed = await platform.confirmDialog(t("confirm.leave_sub"));
        if (!confirmed) return;
        mutation.mutate(sub.id);
      }}
      disabled={mutation.isLoading}
    >
      {t("leave")}
      <LogOutIcon className="ml-auto h-4 w-4" />
    </DropdownMenuItem>
  );
};
