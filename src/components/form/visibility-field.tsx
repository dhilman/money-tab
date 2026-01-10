import { UserRoundPlusIcon } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { BentoContent } from "~/components/bento-box";
import { FormField, FormIcon, FormLabelWithIcon } from "~/components/form/form";
import { Switch } from "~/components/ui/switch";
import type { Visibility } from "~/lib/consts/types";
import { cn } from "~/lib/utils";
import { calcIsPublic, calcPublicDays } from "~/lib/visibility";

interface VisibilityFieldProps {
  className?: string;
  createdAt: string;
  visibility: Visibility;
  participants: number;
  setVisibility: (v: Visibility) => void;
}

export const VisibilityField = ({
  className,
  createdAt,
  visibility,
  participants,
  setVisibility,
}: VisibilityFieldProps) => {
  const { t } = useTranslation();
  const isPublic = calcIsPublic({ createdAt, visibility });
  const isPublicDays = calcPublicDays(createdAt);

  const onCheckedChange = (v: boolean) => {
    if (v) {
      if (isPublicDays > 0) {
        setVisibility("RESTRICTED");
      } else {
        setVisibility("PUBLIC");
      }
    } else {
      setVisibility("PRIVATE");
    }
  };

  const Hint = () => {
    if (visibility === "PRIVATE" || !isPublic) {
      if (participants > 1) {
        return <Trans i18nKey="visibility_private_with_participants_desc" />;
      }
      return <Trans i18nKey="visibility_private_desc" />;
    }
    if (visibility === "RESTRICTED") {
      return (
        <Trans
          i18nKey="visibility_restricted_desc"
          values={{ days: isPublicDays }}
        />
      );
    }
    return <Trans i18nKey="visibility_public_desc" />;
  };

  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      <BentoContent>
        <FormField className="justify-between">
          <FormLabelWithIcon>
            <FormIcon className="bg-primary">
              <UserRoundPlusIcon className="text-primary-foreground h-5 w-5" />
            </FormIcon>
            <div>{t("allow_others_to_join")}</div>
          </FormLabelWithIcon>
          <Switch checked={isPublic} onCheckedChange={onCheckedChange} />
        </FormField>
      </BentoContent>
      <div className="text-hint px-2 text-left text-sm">
        <Hint />
      </div>
    </div>
  );
};
