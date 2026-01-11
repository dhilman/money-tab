import { CalendarIcon, ClockIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bento, BentoContent } from "~/components/bento-box";
import { AddDateButton, DateInputV1 } from "~/components/form/date-input-v1";
import { FileInput, FilePreviewList } from "~/components/form/file-input";
import { useTxEditCtx } from "~/components/pages/tx/form/tx-form-ctx";
import { useTgDrawerState } from "~/components/provider/platform/tg";
import {
  ReceiptScanInput,
  ReceiptSplitDrawer,
  ReceiptSummaryCard,
  useReceiptCtxOptional,
} from "~/components/receipt";
import { getDateYYYYMMDD } from "~/lib/dates/dates";

export const TxEditOptions = () => {
  const { files, setFiles } = useTxEditCtx();
  const receiptCtx = useReceiptCtxOptional();
  const splitDrawer = useTgDrawerState();

  const hasItems = (receiptCtx?.receipt?.items.length ?? 0) > 0;

  return (
    <div className="w-full space-y-5">
      <Bento>
        <BentoContent className="overflow-hidden">
          <DateInput />
          <TimeInput />
          <ReceiptScanInput disabled={!!receiptCtx?.receipt} />
          <FileInput
            onUploadStart={(id) =>
              setFiles((prev) => [
                ...prev,
                { id, uploading: true, url: "", key: "", size: 0, type: "" },
              ])
            }
            onUploadFail={(id) =>
              setFiles((prev) => prev.filter((x) => x.id !== id))
            }
            onUploadSuccess={(id, v) =>
              setFiles((prev) => prev.map((x) => (x.id === id ? v : x)))
            }
            disabled={files.length > 3}
          />
        </BentoContent>
      </Bento>
      {receiptCtx?.receipt && (
        <ReceiptSummaryCard
          onSplitByItems={hasItems ? splitDrawer.onOpen : undefined}
        />
      )}
      <FilePreviewList
        files={files}
        onRemove={(id) => setFiles((prev) => prev.filter((x) => x.id !== id))}
      />
      {receiptCtx && (
        <ReceiptSplitDrawer
          open={splitDrawer.open}
          onOpenChange={splitDrawer.onOpenChange}
        />
      )}
    </div>
  );
};

const DateInput = () => {
  const { t } = useTranslation();
  const { date, setDate } = useTxEditCtx();
  const [autofocus] = useState(date === "");

  if (!date) {
    return (
      <AddDateButton
        icon={CalendarIcon}
        label={t("add_date")}
        onClick={() => setDate(getDateYYYYMMDD(new Date()))}
      />
    );
  }

  return (
    <DateInputV1
      label={t("date")}
      type="date"
      value={date}
      setValue={setDate}
      autofocus={autofocus}
      removable
    />
  );
};

const TimeInput = () => {
  const { t } = useTranslation();
  const { date, time, setTime } = useTxEditCtx();
  const [autofocus] = useState(time === "");

  if (!date) return null;

  if (!time) {
    return (
      <AddDateButton
        icon={ClockIcon}
        label={t("add_time")}
        onClick={() => setTime("12:00")}
      />
    );
  }

  return (
    <DateInputV1
      label={t("time")}
      type="time"
      autofocus={autofocus}
      value={time}
      setValue={setTime}
      removable
    />
  );
};
