import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
import { TourLocalStorage } from "~/components/pages/tour/tour-provider";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { MyLink } from "~/components/router/link";
import { ButtonV1 } from "~/components/ui/buttonv1";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemIconContainer,
  ListItemLeft,
} from "~/components/ui/list-item";

export const TourStartListItem = () => {
  const { t } = useTranslation();
  const { isHidden } = useTour();
  if (isHidden) return null;

  return (
    <Bento>
      <List>
        <ListItem as={MyLink} route={{ pathname: "/webapp/tour" }}>
          <ListItemLeft>
            <ListItemIconContainer size="xl" className="bg-tertiary">
              👋🏻
            </ListItemIconContainer>
          </ListItemLeft>
          <ListItemBody>
            <div>{t("what_is_moneytab")}</div>
            <ButtonV1
              variant="primary"
              size="badge"
              className="light-ray ml-auto"
            >
              {t("learn")}
            </ButtonV1>
          </ListItemBody>
        </ListItem>
      </List>
    </Bento>
  );
};

function useTour() {
  const { hasBeenCreator, isLoading } = useProfile();
  const [dismissable] = useState(() => {
    if (typeof window === "undefined") return false;
    return TourLocalStorage.isDismissable;
  });
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return TourLocalStorage.isDismissed;
  });

  function isHidden() {
    if (isLoading) return true;
    if (hasBeenCreator) return true;
    if (dismissed) return true;
    return false;
  }

  return {
    isHidden: isHidden(),
    dismissable,
    setDismissed,
  };
}
