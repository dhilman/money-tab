import dayjs from "dayjs";
import i18n from "~/lib/i18n";

type Locales = "en" | "ru";

const loadDaysJsLocale = async (locale: Locales) => {
  switch (locale) {
    case "ru":
      await import("dayjs/locale/ru");
      break;
    default:
      break;
  }
};

export const changeLocale = async (locale: "en" | "ru") => {
  if (i18n.language === locale) {
    return;
  }
  loadDaysJsLocale(locale)
    .then(() => {
      dayjs.locale(locale);
    })
    .catch((e) => {
      console.error(e);
    });
  await i18n.changeLanguage(locale);
};
