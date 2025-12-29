import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { useContacts } from "~/components/provider/auth/auth-provider";
import { useGroups } from "~/components/provider/users-provider";
import {
  AnimationPlayer,
  useImportAnimationPlayer,
} from "~/components/ui/animation";
import { cn } from "~/lib/utils";

interface Props {
  el: "sub" | "tx";
  className?: string;
}

export const EmptyOptions = ({ el, className }: Props) => {
  const { t } = useTranslation();
  const { parties } = useParticipantsCtx();
  const contacts = useContacts();
  const groups = useGroups();

  if (parties.length > 1 || contacts.length > 0 || groups.length > 0) {
    return null;
  }

  return (
    <Bento
      className={cn(
        "flex flex-col items-center justify-center gap-6",
        className
      )}
    >
      <Player />
      <div className="w-full space-y-2 text-center">
        <div className="text-lg font-medium capitalize">
          {t("no_contacts_yet")}
        </div>
        <div className="px-8 text-hint">
          {el === "sub"
            ? t("invite_after_create_sub")
            : t("invite_after_create_tx")}
        </div>
      </div>
    </Bento>
  );
};

const Player = () => {
  useImportAnimationPlayer();

  return (
    <AnimationPlayer
      name="duck-send"
      style={{ width: "200px", height: "200px" }}
    />
  );
};
