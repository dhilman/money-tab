import { useTranslation } from "react-i18next";
import { useMe } from "~/components/provider/auth/auth-provider";

interface Props {
  user: {
    id: string;
    name: string;
  } | null;
}

export const PartyUserName = ({ user }: Props) => {
  const { t } = useTranslation();
  const me = useMe();

  if (!user) {
    return <div className="truncate text-base">{t("someone_new")}</div>;
  }

  if (user.id === me.id) {
    return <div className="truncate text-base capitalize">{t("you")}</div>;
  }

  return <div className="truncate text-base">{user.name}</div>;
};
