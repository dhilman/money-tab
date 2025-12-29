import { env } from "~/env.mjs";
import { type RouterOutputs } from "~/utils/api";

type Profile = RouterOutputs["user"]["start"];

interface StoredProfile {
  user: Profile["user"];
  version: string;
}

const DataCache = {
  store: (data: Profile) => {
    const stored: StoredProfile = {
      user: data.user,
      version: env.NEXT_PUBLIC_DEPLOY_ID,
    };
    localStorage.setItem("start-data", JSON.stringify(stored));
  },
  get: () => {
    if (typeof window === "undefined") return undefined;
    const data = localStorage.getItem("start-data");
    if (!data) return undefined;
    const parsed = JSON.parse(data) as StoredProfile;
    if (parsed?.version !== env.NEXT_PUBLIC_DEPLOY_ID) {
      return undefined;
    }
    return parsed;
  },
};

export const cacheProfile = DataCache.store;

export function getPlaceholderProfile(): Profile {
  const data = DataCache.get();
  return {
    user: data?.user || {
      id: "",
      isRegistered: false,
      languageCode: "en",
      username: "",
      firstName: "",
      lastName: "",
      createdAt: "",
      updatedAt: "",
      telegramId: null,
      photoUrl: null,
      accentColorId: null,
      tgIsPremium: false,
      timezone: "",
      timezoneManual: null,
      role: "USER",
      referrer: null,
      hideBalance: false,
      meInPaidFor: false,
      currencyCode: "USD",
      tonAddress: null,
    },
    hasBeenCreator: false,
    balances: [],
    connections: [],
    subscriptions: [],
    transactions: [],
    groups: [],
  };
}
