import { useTranslation } from "react-i18next";
import { CurrencyAmount } from "~/components/amount";
import { Bento } from "~/components/bento-box";
import { useContribsCtx } from "~/components/common/contribs/provider";
import { UserAvatarOrPlaceholder } from "~/components/pages/user/user-avatar";
import { useMe } from "~/components/provider/auth/auth-provider";
import { useUser } from "~/components/provider/users-provider";
import { useWebAppRouter } from "~/components/router/router";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";
import { cn } from "~/lib/utils";

interface BaseContrib {
  id: string;
  userId: string | null;
  amountOwed: number;
  amountPaid: number;
  status: "CONFIRMED" | "PENDING" | "NOT_DELIVERED";
}

interface Props {
  headerHidden?: boolean;
}

export const Contributions = ({ headerHidden }: Props) => {
  const { t } = useTranslation();

  return (
    <Bento className="gap-3">
      {!headerHidden && (
        <div className="w-full font-semibold capitalize">
          {t("participants")}
        </div>
      )}
      <ContribsPaidBy />
      <ContribsPaidFor />
      <NotSeenDisclaimer />
    </Bento>
  );
};

const NotSeenDisclaimer = () => {
  const { t } = useTranslation();
  const { isCreator, contribs } = useContribsCtx();
  const notSeen = contribs.some(
    (c) => c.status === "NOT_DELIVERED" && c.userId,
  );

  if (!notSeen) return null;
  if (!isCreator) return null;

  return (
    <div className="-mt-1 w-full px-3 text-sm text-hint">
      <span className="mr-0.5 font-bold text-orange-500">*</span>
      {t("not_seen_desc")}
    </div>
  );
};

const ContribsPaidBy = () => {
  const { contribs, isLoading } = useContribsCtx();

  const filtered = contribs.filter((c) => c.amountPaid > 0);

  if (isLoading) {
    return (
      <List>
        <ContribLoading />
      </List>
    );
  }

  if (filtered.length === 0) return null;

  return (
    <List>
      {filtered.map((c) => (
        <ContribListItem key={c.id} contrib={c} />
      ))}
    </List>
  );
};

const ContribsPaidFor = () => {
  const { contribs } = useContribsCtx();
  const filtered = contribs.filter((c) => c.amountPaid === 0);
  if (filtered.length === 0) return null;

  return (
    <List>
      {filtered.map((c) => (
        <ContribListItem key={c.id} contrib={c} />
      ))}
    </List>
  );
};

interface ContribListItemProps {
  contrib: BaseContrib;
}

const ContribListItem = ({ contrib }: ContribListItemProps) => {
  const { t } = useTranslation();
  const me = useMe();
  const router = useWebAppRouter();
  const {
    joinContribId,
    currencyCode,
    isCreator,
    isParticipant,
    copyUrl,
    joinMutation,
  } = useContribsCtx();
  const userId = contrib.userId || (joinContribId === contrib.id ? me.id : "");
  const user = useUser(userId);

  const isPayer = contrib.amountPaid > 0;
  const isUnassigned = !contrib.userId;
  const isNotDelivered = !!contrib.userId && contrib.status === "NOT_DELIVERED";
  const isJoinContrib = joinContribId === contrib.id;

  const showNotDelivered = isCreator && isNotDelivered;
  const showInvite = isCreator && (isUnassigned || isNotDelivered);
  const showJoin =
    !isCreator && !isParticipant && !joinContribId && isUnassigned;

  return (
    <ListItem
      onClick={() => {
        if (showJoin) {
          joinMutation.mutate(contrib.id);
          return;
        }
        if (showInvite) {
          copyUrl(contrib.id);
          return;
        }
        if (contrib.userId) {
          void router.push({
            pathname: "/webapp/user/[id]",
            query: { id: contrib.userId },
          });
        }
      }}
    >
      <ListItemLeft>
        <UserAvatarOrPlaceholder
          user={user}
          size="xl"
          accentHash={contrib.id}
        />
      </ListItemLeft>
      <ListItemBody className={cn(isJoinContrib && "text-hint")}>
        <div className="w-full truncate">
          <div className="truncate text-base">
            <ContribUserName user={user} />
            {showNotDelivered && (
              <span className="ml-0.5 font-bold text-orange-500">*</span>
            )}
          </div>
          {isPayer && <div className="text-sm text-hint">{t("payer")}</div>}
        </div>
        <div className="ml-auto text-right">
          {contrib.amountOwed > 0 && (
            <CurrencyAmount
              amount={contrib.amountOwed}
              currency={currencyCode}
            />
          )}
          {showInvite && (
            <div className="text-sm text-link">{t("share_link")}</div>
          )}
          {showJoin && <div className="text-sm text-link">{t("join")}</div>}
        </div>
      </ListItemBody>
    </ListItem>
  );
};

interface ContribUserNameProps {
  user: {
    name: string;
    me?: boolean;
  } | null;
}

const ContribUserName = ({ user }: ContribUserNameProps) => {
  const { t } = useTranslation();

  if (!user) return <>{t("unassigned")}</>;

  return (
    <>
      {user.name}
      {user.me && <span className="text-hint"> ({t("you")})</span>}
    </>
  );
};

const ContribLoading = () => {
  return (
    <ListItem className="animate-pulse">
      <ListItemLeft>
        <div className="h-10 w-10 rounded-full bg-foreground/10" />
      </ListItemLeft>
      <ListItemBody className="h-16">
        <div className="h-4 w-24 rounded-lg bg-foreground/10" />
        <div className="ml-auto h-4 w-16 rounded-lg bg-foreground/10" />
      </ListItemBody>
    </ListItem>
  );
};
