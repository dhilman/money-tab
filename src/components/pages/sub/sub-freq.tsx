import { useTranslation } from "react-i18next";
import type { CycleUnit } from "~/lib/consts/types";

interface Props {
  unit: CycleUnit;
  value: number;
}

export const SubFrequency = ({ unit, value }: Props) => {
  const { t } = useTranslation();

  switch (unit) {
    case "DAY":
      return <>{t("daily", { count: value })}</>;
    case "WEEK":
      return <>{t("weekly", { count: value })}</>;
    case "MONTH":
      return <>{t("monthly", { count: value })}</>;
    case "YEAR":
      return <>{t("yearly", { count: value })}</>;
  }
};
