import { default as i18nBE } from "i18next";
import en from "public/locales/en/bot.json";
import ru from "public/locales/ru/bot.json";

const resources = {
  en: {
    bot: en,
  },
  ru: {
    bot: ru,
  },
};

i18nBE
  .init({
    resources,
    defaultNS: "bot" as const,
    ns: "bot",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  })
  .catch(console.error);

export default i18nBE;
