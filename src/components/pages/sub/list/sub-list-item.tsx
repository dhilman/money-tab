import { useMemo } from "react";
import { CurrencyAmount } from "~/components/amount";
import { SubNextDate } from "~/components/pages/sub/list/sub";
import { UserAvatarOrPlaceholder } from "~/components/pages/user/user-avatar";
import { UserNamesList } from "~/components/pages/user/user-names";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { MyLink } from "~/components/router/link";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import type { RouterOutputs } from "~/utils/api";

type Sub = RouterOutputs["user"]["start"]["subscriptions"][number];

interface SubListItemProps {
  dateAbsolute?: boolean;
  withCycle?: boolean;
  userId?: string;
  sub: Sub;
}

export const SubListItem = ({
  dateAbsolute,
  withCycle,
  userId,
  sub,
}: SubListItemProps) => {
  const { user: me } = useProfile();
  const amount = useMemo(() => {
    const contrib = sub.contribs.find((c) => c.userId === me.id);
    if (!userId) return contrib?.amountOwed || null;
    const other = sub.contribs.find((c) => c.userId === userId);
    if (!contrib || !other) return null;
    if (contrib.amountPaid > 0) return other.amountOwed;
    if (other.amountPaid > 0) return -contrib.amountOwed;
    return null;
  }, [sub, me.id, userId]);

  const others = useMemo(() => {
    return sub.contribs.filter((c) => c.userId !== me.id && c.userId);
  }, [sub, me.id]);

  return (
    <ListItem
      as={MyLink}
      route={{ pathname: "/webapp/sub/[id]", query: { id: sub.id } }}
    >
      <ListItemLeft>
        <UserAvatarOrPlaceholder
          user={null}
          accentHash={sub.id}
          initials={sub.name.slice(0, 1)}
          size="xl"
        />
      </ListItemLeft>
      <ListItemBody className="h-16 gap-4 truncate overflow-hidden">
        <div className="flex flex-col truncate text-left">
          <div className="truncate text-ellipsis whitespace-nowrap">
            {sub.name}
          </div>
          <UserNamesList
            className="text-hint truncate text-sm text-ellipsis"
            userIds={others.map((u) => u.userId)}
          />
        </div>
        {amount ? (
          <div className="ml-auto flex flex-col items-end">
            <div className="inline-flex shrink-0 items-center justify-center gap-1">
              <CurrencyAmount
                amount={amount}
                currency={sub.currencyCode}
                color={userId ? "amount" : "symbol"}
              />
            </div>
            <SubNextDate sub={sub} absolute={dateAbsolute} />
          </div>
        ) : null}
      </ListItemBody>
    </ListItem>
  );
};
