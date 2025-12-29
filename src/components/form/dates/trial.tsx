import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomCycleInput } from "~/components/form/dates/custom-cycle";
import { NativeSelect } from "~/components/form/native-select";
import { ListItem, ListItemBody } from "~/components/ui/list-item";
import type { Cycle } from "~/lib/consts/types";
import i18n from "~/lib/i18n";

interface TrialInputProps {
  trial: Cycle | null;
  setTrial: (trial: Cycle | null) => void;
}

export const TrialInput = ({ trial, setTrial }: TrialInputProps) => {
  const { t } = useTranslation();
  const options = useMemo(() => {
    return [
      { value: "NONE", label: t("trial_none") },
      { value: "WEEK", label: t("week") },
      { value: "MONTH", label: t("month") },
      { value: "YEAR", label: t("year") },
      { value: "CUSTOM", label: t("custom") },
    ];
  }, [t]);

  const [isCustom, setIsCustom] = useState(() => {
    if (!trial) return false;
    return trial.value !== 1;
  });

  const value = useMemo(() => {
    if (!trial) return "NONE";
    if (isCustom) return "CUSTOM";
    if (trial.unit === "WEEK" && trial.value === 1) return "WEEK";
    if (trial.unit === "MONTH" && trial.value === 1) return "MONTH";
    if (trial.unit === "YEAR" && trial.value === 1) return "YEAR";
    return "CUSTOM";
  }, [isCustom, trial]);

  return (
    <>
      <ListItem key={isCustom ? "custom" : "default"}>
        <ListItemBody size="sm">
          <div>{t("trial")}</div>
          <NativeSelect
            options={options}
            value={value}
            onChange={(v) => {
              switch (v) {
                case "NONE":
                  setIsCustom(false);
                  setTrial(null);
                  return;
                case "WEEK":
                case "MONTH":
                case "YEAR":
                  setIsCustom(false);
                  setTrial({ unit: v, value: 1 });
                  return;
                case "CUSTOM":
                  if (!trial) setTrial({ unit: "MONTH", value: 1 });
                  setIsCustom(true);
                  return;
              }
            }}
            className="ml-auto"
          />
        </ListItemBody>
      </ListItem>
      {isCustom && trial && (
        <CustomCycleInput
          label={t("duration")}
          cycle={trial}
          onChange={setTrial}
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
