import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { UserAvatar } from "~/components/pages/user/user-avatar";
import { MyLink } from "~/components/router/link";
import type { RouterOutputs } from "~/utils/api";

type UserType = RouterOutputs["admin"]["users"]["users"][number];

export const userCols: ColumnDef<UserType>[] = [
  {
    accessorKey: "photoUrl",
    header: () => <div className="text-center">Avatar</div>,
    cell: ({ row }) => {
      return (
        <MyLink
          route={{
            pathname: "/admin/user/[id]",
            query: { id: row.original.id },
          }}
        >
          <UserAvatar size="md" user={row.original} className="mx-auto" />
        </MyLink>
      );
    },
  },
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "telegramId",
    header: "Telegram ID",
  },
  {
    accessorKey: "isRegistered",
    header: () => `📞`,
    cell: ({ row }) => {
      const v = row.original.isRegistered;
      if (!v) return null;
      return `✅`;
    },
  },
  {
    accessorKey: "tgIsPremium",
    header: () => <div className="whitespace-nowrap">🌟</div>,
    cell: ({ row }) => {
      const v = row.original.tgIsPremium;
      if (!v) return null;
      return `⭐️`;
    },
  },
  {
    accessorKey: "languageCode",
    header: () => `🌐`,
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => {
      const v = row.original;
      return (
        <div className="whitespace-nowrap">
          {v.username ? v.username : `${v.firstName ?? ""} ${v.lastName ?? ""}`}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: () => <div className="whitespace-nowrap">Created At</div>,
    cell: ({ row }) => {
      return dayjs(row.original.createdAt, { utc: true }).format("MMM D, YY");
    },
  },
  {
    accessorKey: "timezone",
    header: "Timezone",
  },

  {
    accessorKey: "referrer",
    header: "Referrer",
  },
  {
    accessorKey: "txs",
    header: "TXs",
  },
  {
    accessorKey: "subs",
    header: "Subs",
  },
  {
    accessorKey: "contacts",
    header: "Contacts",
  },
];
