import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { DateInputRow } from "~/components/form/date-input-v1";
import { FrequencyInput } from "~/components/form/dates/frequency";
import { TrialInput } from "~/components/form/dates/trial";
import { ReminderInput } from "~/components/form/reminder-select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { ListItem, ListItemBody } from "~/components/ui/list-item";
import { Switch } from "~/components/ui/switch";
import type { Cycle, ReminderValue } from "~/lib/consts/types";
import { getDateYYYYMMDD } from "~/lib/dates/dates";

interface SubDateInputsProps {
  defaultExpanded?: boolean;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  reminder: ReminderValue | null;
  setReminder?: (reminder: ReminderValue | null) => void;
  cycle: Cycle;
  setCycle: (cycle: Cycle) => void;
  trial: Cycle | null;
  setTrial: (trial: Cycle | null) => void;
}

export const SubDateInputs = ({
  defaultExpanded,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  reminder,
  setReminder,
  cycle,
  setCycle,
  trial,
  setTrial,
}: SubDateInputsProps) => {
  const { t } = useTranslation();

  return (
    <Bento>
      <AccordionWrapper defaultExpanded={defaultExpanded}>
        <div className="flex w-full flex-col gap-3">
          <BentoContent>
            <TrialInput trial={trial} setTrial={setTrial} />
          </BentoContent>
          <BentoContent>
            <FrequencyInput freq={cycle} setFreq={setCycle} />
            <DateInputRow
              label={t("start_date")}
              type="date"
              value={startDate}
              setValue={setStartDate}
            />
            <EndDateInput endDate={endDate} setEndDate={setEndDate} />
          </BentoContent>
          {setReminder && (
            <BentoContent>
              <ReminderInput reminder={reminder} setReminder={setReminder} />
            </BentoContent>
          )}
        </div>
      </AccordionWrapper>
    </Bento>
  );
};

interface AccordionWrapperProps {
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const AccordionWrapper = ({
  children,
  defaultExpanded,
}: AccordionWrapperProps) => {
  const { t } = useTranslation();
  return (
    <Accordion
      type="multiple"
      className="w-full border-none bg-none"
      defaultValue={defaultExpanded ? ["options"] : undefined}
    >
      <AccordionItem value="options" className="border-0">
        <AccordionTrigger className="px-2 font-semibold">
          {t("options")}
        </AccordionTrigger>
        <AccordionContent className="w-full">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

interface EndDateInputProps {
  endDate: string;
  setEndDate: (date: string) => void;
}

export const EndDateInput = ({ endDate, setEndDate }: EndDateInputProps) => {
  const { t } = useTranslation();

  return (
    <>
      <ListItem>
        <ListItemBody size="sm">
          <div>{t("ends")}</div>
          <Switch
            checked={endDate !== ""}
            onCheckedChange={(checked) => {
              if (!checked) {
                setEndDate("");
                return;
              }
              // 1 month from now
              const date = dayjs().add(1, "month");
              setEndDate(getDateYYYYMMDD(date));
            }}
            className="ml-auto"
          />
        </ListItemBody>
      </ListItem>
      {endDate !== "" && (
        <DateInputRow
          label={t("end_date")}
          type="date"
          value={endDate}
          setValue={setEndDate}
        />
      )}
    </>
  );
};
