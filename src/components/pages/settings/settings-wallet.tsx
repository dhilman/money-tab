import { CopyIcon, LinkIcon, LogOutIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { TonIcon } from "~/components/icon/ton-icon";
import { useWallet } from "~/components/provider/wallet-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";

export const SettingsWalletConnect = () => {
  return (
    <Bento>
      <BentoContent>
        <ListItemWallet />
      </BentoContent>
    </Bento>
  );
};

function ListItemWallet() {
  const { status } = useWallet();
  switch (status) {
    case "CONNECTED":
      return <ListItemWalletConnected />;
    case "NOT_CONNECTED":
      return <ListItemWalletConnect />;
    case "BROKEN":
      return <ListItemWalletReconnect />;
  }
}

function ListItemWalletConnected() {
  const { t } = useTranslation();
  const { copy, disconnect, friendlyShort } = useWallet();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <ListItem>
          <ListItemTonIcon />
          <ListItemBody size="sm" className="w-full gap-2">
            <div>{friendlyShort}</div>
            <div className="ml-auto inline-flex items-center gap-2 text-green-500">
              <span>{t("connected")}</span>
              <LinkIcon className="h-4 w-4 " />
            </div>
          </ListItemBody>
        </ListItem>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem onSelect={copy}>
          {t("copy_address")}
          <CopyIcon className="ml-auto h-4 w-4 shrink-0" />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={disconnect}>
          {t("disconnect")}
          <LogOutIcon className="ml-auto h-4 w-4 shrink-0" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ListItemWalletReconnect() {
  const { t } = useTranslation();
  const { connect, friendlyShort } = useWallet();

  return (
    <ListItem as="button" onClick={connect}>
      <ListItemTonIcon />
      <ListItemBody size="sm" className="w-full gap-2">
        <div>{friendlyShort}</div>
        <div className="ml-auto inline-flex items-center gap-2 text-primary">
          <span>{t("reconnect")}</span>
          <LinkIcon className="h-4 w-4 " />
        </div>
      </ListItemBody>
    </ListItem>
  );
}

function ListItemWalletConnect() {
  const { t } = useTranslation();
  const { connect } = useWallet();

  return (
    <ListItem as="button" onClick={connect}>
      <ListItemTonIcon />
      <ListItemBody size="sm" className="w-full gap-2 text-primary">
        <div>{t("connect_wallet")}</div>
      </ListItemBody>
    </ListItem>
  );
}

function ListItemTonIcon() {
  return (
    <ListItemLeft>
      <TonIcon className="h-[30px] w-[30px]" />
    </ListItemLeft>
  );
}
