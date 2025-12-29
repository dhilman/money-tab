import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useUsersByIds } from "~/components/provider/users-provider";
import { formatListItems } from "~/lib/format/format";

interface UserNamesListProps {
  className?: string;
  userIds: (string | null)[];
}

export const UserNamesList = ({ className, userIds }: UserNamesListProps) => {
  const { t } = useTranslation();
  const users = useUsersByIds(userIds);
  const str = useMemo(() => {
    if (users.length > 2) {
      const slice = users.slice(0, 2).map((u) => u.name);
      const othersCount = users.length - slice.length;
      return formatListItems([...slice, t("others", { count: othersCount })]);
    }
    return formatListItems(users.map((u) => u.name));
  }, [users, t]);

  return <div className={className}>{str}</div>;
};
