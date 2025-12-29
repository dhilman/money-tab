import { BarChartBigIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SubListItem } from "~/components/pages/sub/list/sub-list-item";
import { MyLink } from "~/components/router/link";
import {
  AnimatedImage,
  AnimatedImageContainer,
} from "~/components/ui/animated-image";
import { ButtonV1 } from "~/components/ui/buttonv1";
import { IconBox } from "~/components/ui/iconv1";
import { List } from "~/components/ui/list";
import type { RouterOutputs } from "~/utils/api";

type Subscription = RouterOutputs["user"]["start"]["subscriptions"][number];

interface Source {
  userId?: string;
  groupId?: string;
}

interface SubListStatefullProps {
  source?: Source;
  isLoading?: boolean;
  subs: Subscription[];
  hideCreate?: boolean;
}

export function SubListStatefull({
  source,
  isLoading,
  subs,
  hideCreate,
}: SubListStatefullProps) {
  const { t } = useTranslation();

  if (isLoading) return null;

  if (subs.length === 0) {
    return (
      <div className="flex w-full flex-col items-center px-7 pb-8 pt-4">
        <AnimatedImageContainer>
          <AnimatedImage name="tv" />
        </AnimatedImageContainer>
        <div className="mt-2.5 text-center text-base font-semibold">
          {t("your_subscriptions_will_be_here")}
        </div>
        {!hideCreate && (
          <MyLink
            route={{ pathname: "/webapp/sub/create", query: source }}
            className="mt-4 text-sm font-semibold text-link"
          >
            {t("add_subscription")}
          </MyLink>
        )}
      </div>
    );
  }

  return (
    <>
      <ViewMoreButton />
      <SubsList subs={subs} userId={source?.userId} />
    </>
  );
}

const ViewMoreButton = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full p-4">
      <MyLink route={{ pathname: "/webapp/subs" }} asChild>
        <ButtonV1 size="lg" variant="tertiary" className="w-full gap-2">
          <IconBox className="h-6 w-6">
            <BarChartBigIcon className="h-5 w-5 text-foreground" />
          </IconBox>
          {t("statistics")}
        </ButtonV1>
      </MyLink>
    </div>
  );
};

interface SubsListProps {
  subs: Subscription[];
  dateAbsolute?: boolean;
  withCycle?: boolean;
  userId?: string;
}

export const SubsList = ({
  subs,
  dateAbsolute,
  withCycle,
  userId,
}: SubsListProps) => {
  const ordered = useMemo(() => subs.sort(subsSortFunc), [subs]);

  return (
    <List>
      {ordered.map((sub) => (
        <SubListItem
          key={sub.id}
          sub={sub}
          withCycle={withCycle}
          dateAbsolute={dateAbsolute}
          userId={userId}
        />
      ))}
    </List>
  );
};

function subsSortFunc(a: Subscription, b: Subscription) {
  if (a.renewalDate === b.renewalDate) return 0;
  if (!a.renewalDate) return 1;
  if (!b.renewalDate) return -1;
  return a.renewalDate < b.renewalDate ? -1 : 1;
}
