import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomCycleInput } from "~/components/form/dates/custom-cycle";
import { NativeSelect } from "~/components/form/native-select";
import { ListItem, ListItemBody } from "~/components/ui/list-item";
import type { Cycle } from "~/lib/consts/types";
import i18n from "~/lib/i18n";

interface FreqInputProps {
  freq: Cycle;
  setFreq: (freq: Cycle) => void;
}

export const FrequencyInput = ({ freq, setFreq }: FreqInputProps) => {
  const { t } = useTranslation();
  const [isCustom, setIsCustom] = useState(() => {
    return freq.value !== 1;
  });
  const options = useMemo(() => {
    return [
      { value: "WEEK", label: t("weekly") },
      { value: "MONTH", label: t("monthly") },
      { value: "YEAR", label: t("yearly") },
      { value: "CUSTOM", label: t("custom") },
    ];
  }, [t]);

  const value = useMemo(() => {
    if (isCustom) return "CUSTOM";
    if (freq.unit === "WEEK" && freq.value === 1) return "WEEK";
    if (freq.unit === "MONTH" && freq.value === 1) return "MONTH";
    if (freq.unit === "YEAR" && freq.value === 1) return "YEAR";
    return "CUSTOM";
  }, [freq.unit, freq.value, isCustom]);

  return (
    <>
      <ListItem>
        <ListItemBody size="sm">
          <div>{t("frequency")}</div>
          <NativeSelect
            options={options}
            value={value}
            onChange={(v) => {
              switch (v) {
                case "WEEK":
                case "MONTH":
                case "YEAR":
                  setIsCustom(false);
                  setFreq({ unit: v, value: 1 });
                  return;
                case "CUSTOM":
                  setIsCustom(true);
                  return;
              }
            }}
            className="ml-auto"
          />
        </ListItemBody>
      </ListItem>
      {isCustom && (
        <CustomCycleInput
          label={t("every")}
          cycle={freq}
          onChange={setFreq}
          options={[
            { value: "DAY", label: i18n.t("day_s") },
            { value: "WEEK", label: i18n.t("week_s") },
            { value: "MONTH", label: i18n.t("month_s") },
            { value: "YEAR", label: i18n.t("year_s") },
          ]}
        />
      )}
    </>
  );
};
