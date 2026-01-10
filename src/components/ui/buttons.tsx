import { EllipsisIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeftRightIcon } from "~/components/icon/arrow-left-right-icon";
import { RepeatIcon } from "~/components/icon/repeat-icon";
import { ShareIcon } from "~/components/icon/share-icon";
import { useShareProfile } from "~/components/provider/auth/auth-provider";
import { MyLink } from "~/components/router/link";
import type { NewRoute } from "~/components/router/route";
import { ButtonV1 } from "~/components/ui/buttonv1";
import { IconContainer } from "~/components/ui/icon";

interface LinkProps {
  route: NewRoute;
}

export const NewSubButton = ({ route }: LinkProps) => {
  const { t } = useTranslation();
  return (
    <ButtonV1 size="stack" className="w-full" variant="default" asChild>
      <MyLink route={route}>
        <IconContainer className="h-7 w-7">
          <RepeatIcon className="fill-primary" />
        </IconContainer>

        <div>{t("sub")}</div>
      </MyLink>
    </ButtonV1>
  );
};

export const NewTxButton = ({ route }: LinkProps) => {
  const { t } = useTranslation();
  return (
    <ButtonV1 size="stack" variant="primary" className="w-full" asChild>
      <MyLink route={route}>
        <IconContainer className="h-7 w-7">
          <ArrowLeftRightIcon className="fill-primary-foreground" />
        </IconContainer>
        <div>{t("expense")}</div>
      </MyLink>
    </ButtonV1>
  );
};

export const ShareButton = () => {
  const shareProfile = useShareProfile();
  const { t } = useTranslation();
  return (
    <ButtonV1
      size="stack"
      className="w-full"
      variant="default"
      onClick={shareProfile}
    >
      <IconContainer className="h-7 w-7">
        <ShareIcon className="fill-primary" />
      </IconContainer>
      <div>{t("invite")}</div>
    </ButtonV1>
  );
};

interface MoreButtonProps {}

export const MoreButton = React.forwardRef<HTMLButtonElement, MoreButtonProps>(
  (props, ref) => {
    const { t } = useTranslation();
    return (
      <ButtonV1
        size="stack"
        variant="default"
        className="w-full"
        ref={ref}
        {...props}
      >
        <IconContainer className="h-7 w-7">
          <div className="bg-primary text-background h-6 w-6 rounded-full p-0.5">
            <EllipsisIcon className="h-full w-full" />
          </div>
        </IconContainer>
        <div>{t("more")}</div>
      </ButtonV1>
    );
  },
);
MoreButton.displayName = "MoreButton";
