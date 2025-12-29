import { useState } from "react";
import toast from "react-hot-toast";
import {
  AdminTable,
  adminFormatDate,
  type AdminTableValue,
} from "~/components/admin/admin-utils";
import { BentoSessions } from "~/components/admin/bento-sessions";
import { Bento, BentoContent } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { UserAvatar } from "~/components/pages/user/user-avatar";
import { useWebAppRouter } from "~/components/router/router";
import { Button } from "~/components/ui/button";
import { api, type RouterOutputs } from "~/utils/api";

type Props = RouterOutputs["admin"]["user"];

export const AdminUserPage = ({ user, sessions, stats }: Props) => {
  return (
    <WebAppMain className="flex flex-col gap-4">
      <UserDataTableProps user={user} />
      <UserStats stats={stats} />
      <BentoSessions sessions={sessions} />
      <div className="h-10" />
      <AssumeUserButton id={user.id} />
    </WebAppMain>
  );
};

interface UserDataTableProps {
  user: Props["user"];
}

const UserDataTableProps = ({ user }: UserDataTableProps) => {
  const getUserLink = api.admin.getUserLink.useMutation();
  const values: AdminTableValue[] = [
    {
      key: "Avatar",
      value: <UserAvatar size="sm" user={user} />,
    },
    {
      key: "ID",
      value: user.id,
    },
    {
      key: "Telegram ID",
      value: (
        <Button
          onClick={() => getUserLink.mutate({ telegramId: user.telegramId })}
          disabled={!user.telegramId || getUserLink.isLoading}
          variant="secondary"
          className="h-fit w-fit py-0.5"
        >
          {user.telegramId}
        </Button>
      ),
    },
    {
      key: "First Name",
      value: user.firstName,
    },
    {
      key: "Last Name",
      value: user.lastName,
    },
    {
      key: "Username",
      value: user.username,
    },
    {
      key: "Created At",
      value: adminFormatDate(user.createdAt),
    },
    {
      key: "Accent Color",
      value: user.accentColorId,
    },
    {
      key: "Registered",
      value: user.isRegistered ? "Yes" : "No",
    },
    {
      key: "Lang Code",
      value: user.languageCode,
    },
    {
      key: "Timezone",
      value: user.timezone,
    },
    {
      key: "Referrer",
      value: user.referrer,
    },
  ];

  return (
    <Bento>
      <BentoContent className="flex w-full flex-col p-2">
        <AdminTable values={values} />
      </BentoContent>
    </Bento>
  );
};

interface UserStatsProps {
  stats: Props["stats"];
}

const UserStats = ({ stats }: UserStatsProps) => {
  if (!stats) return null;

  const values: AdminTableValue[] = [
    {
      key: "Contacts",
      value: stats.contacts,
    },
    {
      key: "Transactions",
      value: stats.txs,
    },
    {
      key: "Subscriptions",
      value: stats.subs,
    },
    {
      key: "Groups",
      value: stats.groups,
    },
  ];

  return (
    <Bento>
      <BentoContent className="flex w-full flex-col p-2">
        <AdminTable values={values} />
      </BentoContent>
    </Bento>
  );
};

const AssumeUserButton = ({ id }: { id: string }) => {
  const ctx = api.useUtils();
  const router = useWebAppRouter();
  const [minutes, setMinutes] = useState(5);
  const assume = api.admin.assumeUser.useMutation({
    onSuccess: () => {
      toast.success("User assumed");
      void ctx.user.start.invalidate();
      void router.push({ pathname: "/webapp" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Bento>
      <BentoContent>
        <div className="flex w-full items-center justify-between p-2">
          <div className="flex items-center gap-2 rounded-md bg-canvas/50 px-4 py-1 font-medium">
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-16 bg-transparent p-1"
            />
            <span>minutes</span>
          </div>
          <Button
            onClick={() => assume.mutate({ id, minutes })}
            variant="secondary"
            className="w-fit"
          >
            Assume
          </Button>
        </div>
      </BentoContent>
    </Bento>
  );
};
