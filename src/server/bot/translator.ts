import { env } from "~/env.mjs";
import { formatAmountCurrency } from "~/lib/amount/format-amount";
import { URLS } from "~/lib/consts/urls";
import { formatDate } from "~/lib/dates/format-dates";
import { getTgWebAppUrl } from "~/lib/url/share-url";
import i18nBE from "~/server/i18n-server";

interface User {
  telegramId: number | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface Tx {
  transactionId: string;
  amount: number;
  currencyCode: string;
  description?: string | null;
}

interface TxWithCreator extends Tx {
  createdBy: User;
}

interface TxWithUser extends Tx {
  user: User;
}

interface Sub {
  id: string;
  name: string;
  amount: number;
  currencyCode: string;
}

interface SubWithRenewal extends Sub {
  renewalDate: string;
}

interface SubWithCreator extends Sub {
  createdBy: User;
}

interface SubWithUser extends Sub {
  user: User;
}

interface Group {
  id: string;
  name: string;
}

interface GroupWithCreator extends Group {
  createdBy: User;
}

const bot = env.NEXT_PUBLIC_BOT_USERNAME;
const botAppUrl = URLS.BOT_WEB_APP;

const link = (text: string, url: string) => `[${text}](${url})`;
const userLink = (user: User) => {
  let name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  if (name === "") {
    name = user.username || "";
  }
  if (user.telegramId) {
    return link(name, `tg://user?id=${user.telegramId}`);
  }
  if (user.username) {
    return `@${user.username}`;
  }
  return name;
};

export class Translator {
  private t: typeof i18nBE.t;

  constructor(public readonly langCode: string | null) {
    this.t = i18nBE.getFixedT(langCode || "en");
  }

  txAmount(tx: Pick<Tx, "amount" | "currencyCode">) {
    return formatAmountCurrency(tx.amount, tx.currencyCode, {
      withSign: false,
      withSymbol: true,
    });
  }

  startFirst() {
    const msg = this.t("bot:start_first", { bot, botAppUrl });
    if (env.NEXT_PUBLIC_ENV !== "prod") {
      return `WARNING: This is a test environment.\n\n${msg}`;
    }
    return msg;
  }
  start() {
    const msg = this.t("bot:start", { bot, botAppUrl });
    if (env.NEXT_PUBLIC_ENV !== "prod") {
      return `WARNING: This is a test environment.\n\n${msg}`;
    }
    return msg;
  }
  startGroupFirst(groupId: string) {
    return this.t("bot:start_group_first", {
      bot,
      url: getTgWebAppUrl({ type: "GROUP", id: groupId }),
    });
  }
  startGroup(groupId: string) {
    return this.t("bot:start_group", {
      bot,
      url: getTgWebAppUrl({ type: "GROUP", id: groupId }),
    });
  }
  startSupergroup(groupId: string) {
    return this.t("bot:start_supergroup", {
      bot,
      url: getTgWebAppUrl({ type: "GROUP", id: groupId }),
    });
  }
  shareBot() {
    return this.t("bot:share_bot", { bot });
  }
  shareProfile(userId: string) {
    return this.t("bot:share_profile", {
      bot,
      url: getTgWebAppUrl({ type: "USER", id: userId }),
    });
  }
  shareTx(id: string) {
    return this.t("bot:share_tx", {
      url: getTgWebAppUrl({ type: "TX", id: id }),
    });
  }

  privacy() {
    return this.t("bot:privacy", { url: URLS.PRIVACY });
  }

  contactNew(user: User) {
    return this.t("bot:events.contact_new", {
      user: userLink(user),
      botAppUrl,
    });
  }

  private txAndUserParams(user: User, tx: Tx) {
    return {
      url: getTgWebAppUrl({ type: "TX", id: tx.transactionId }),
      amount: this.txAmount(tx),
      description: tx.description,
      user: userLink(user),
    };
  }

  txNew(tx: TxWithCreator) {
    const params = this.txAndUserParams(tx.createdBy, tx);
    if (params.description) {
      return this.t("bot:events.tx_new.default", params);
    }
    return this.t("bot:events.tx_new.no_desc", params);
  }
  txJoined(tx: TxWithUser) {
    const params = this.txAndUserParams(tx.user, tx);
    if (params.description) {
      return this.t("bot:events.tx_joined.default", params);
    }
    return this.t("bot:events.tx_joined.no_desc", params);
  }
  txLeft(tx: TxWithUser) {
    const params = this.txAndUserParams(tx.user, tx);
    if (params.description) {
      return this.t("bot:events.tx_left.default", params);
    }
    return this.t("bot:events.tx_left.no_desc", params);
  }
  txRemovedUser(tx: TxWithCreator) {
    const params = this.txAndUserParams(tx.createdBy, tx);
    if (params.description) {
      return this.t("bot:events.tx_removed_user.default", params);
    }
    return this.t("bot:events.tx_removed_user.no_desc", params);
  }
  txSettle(tx: TxWithCreator) {
    return this.t(
      "bot:events.tx_settle",
      this.txAndUserParams(tx.createdBy, tx)
    );
  }
  txArchived(tx: TxWithCreator) {
    const params = this.txAndUserParams(tx.createdBy, tx);
    if (params.description) {
      return this.t("bot:events.tx_archived.default", params);
    }
    return this.t("bot:events.tx_archived.no_desc", params);
  }

  private subAndUserParams(user: User, sub: Sub) {
    return {
      name: sub.name,
      // TODO: need to add frequency
      amount: formatAmountCurrency(sub.amount, sub.currencyCode, {
        withSign: false,
        withSymbol: true,
      }),
      url: getTgWebAppUrl({ type: "SUB", id: sub.id }),
      user: userLink(user),
    };
  }

  subNew(sub: SubWithCreator) {
    return this.t(
      "bot:events.sub_new",
      this.subAndUserParams(sub.createdBy, sub)
    );
  }

  subJoined(sub: SubWithUser) {
    return this.t(
      "bot:events.sub_joined",
      this.subAndUserParams(sub.user, sub)
    );
  }

  subLeft(sub: SubWithUser) {
    return this.t("bot:events.sub_left", this.subAndUserParams(sub.user, sub));
  }

  subRemovedUser(sub: SubWithCreator) {
    return this.t(
      "bot:events.sub_removed_user",
      this.subAndUserParams(sub.createdBy, sub)
    );
  }

  subsReminder(subs: SubWithRenewal[]) {
    function getParams(sub: SubWithRenewal) {
      return {
        name: sub.name,
        date: formatDate(sub.renewalDate),
        url: getTgWebAppUrl({ type: "SUB", id: sub.id }),
      };
    }

    const [first, ...rest] = subs.map(getParams);
    if (!first) return "";
    if (rest.length === 0) {
      return this.t("bot:events.sub_reminder.single", first);
    }

    return [
      this.t("bot:events.sub_reminder.multiple"),
      this.t("bot:events.sub_reminder.item", first),
      ...rest.map((sub) => this.t("bot:events.sub_reminder.item", sub)),
    ].join("");
  }

  groupCreated(group: GroupWithCreator) {
    return this.t("bot:events.group_created", {
      name: group.name,
      user: userLink(group.createdBy),
      url: getTgWebAppUrl({ type: "GROUP", id: group.id }),
    });
  }
}
