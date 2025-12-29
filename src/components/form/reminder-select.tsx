import { BellIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NativeSelect } from "~/components/form/native-select";
import {
  ListItem,
  ListItemBody,
  ListItemIcon,
  ListItemLeft,
} from "~/components/ui/list-item";
import type { ReminderValue } from "~/lib/consts/types";

interface ReminderOption {
  value: ReminderValue | "";
  label: string;
}

const useReminderOptions = () => {
  const { t } = useTranslation();
  return [
    { value: "", label: t("never") },
    { value: "0D", label: t("on_the_day") },
    { value: "1D", label: t("n_days_before", { count: 1 }) },
    { value: "2D", label: t("n_days_before", { count: 2 }) },
    { value: "3D", label: t("n_days_before", { count: 3 }) },
    { value: "1W", label: t("n_weeks_before", { count: 1 }) },
    { value: "2W", label: t("n_weeks_before", { count: 2 }) },
    { value: "1M", label: t("n_months_before", { count: 1 }) },
    { value: "3M", label: t("n_months_before", { count: 3 }) },
    { value: "6M", label: t("n_months_before", { count: 6 }) },
  ] as ReminderOption[];
};

interface Props {
  className: string;
  value: ReminderValue | null;
  onChange: (value: ReminderValue | null) => void;
}

export const ReminderSelect = ({ className, value, onChange }: Props) => {
  const options = useReminderOptions();
  return (
    <NativeSelect
      className={className}
      value={value || ""}
      options={options}
      onChange={(v) => onChange(v || null)}
    />
  );
};

interface ReminderInputProps {
  reminder: ReminderValue | null;
  setReminder: (reminder: ReminderValue | null) => void;
}

export const ReminderInput = ({
  reminder,
  setReminder,
}: ReminderInputProps) => {
  const { t } = useTranslation();
  const options = useReminderOptions();

  return (
    <ListItem>
      <ListItemLeft size="sm">
        <ListItemIcon
          icon={BellIcon}
          className="bg-purple-500"
          iconClassName="fill-white text-white h-4 w-4 stroke-[2.5px]"
        />
      </ListItemLeft>
      <ListItemBody size="md">
        <div>{t("reminder")}</div>
        <NativeSelect
          options={options}
          value={reminder || ""}
          onChange={(value) => setReminder(value || null)}
          placeholder={t("never")}
          className="ml-auto"
        />
      </ListItemBody>
    </ListItem>
  );
};
