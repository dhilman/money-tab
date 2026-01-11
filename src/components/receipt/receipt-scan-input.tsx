"use client";

import { Loader2Icon, ScanLineIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  ListItem,
  ListItemBody,
  ListItemIcon,
  ListItemLeft,
} from "~/components/ui/list-item";
import { uploadFile } from "~/lib/file-upload";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import { useReceiptCtxOptional } from "./receipt-context";

interface ReceiptScanInputProps {
  disabled?: boolean;
}

/**
 * ListItem row for scanning receipts via camera.
 * Uploads image to S3, then calls receipt.parse mutation.
 */
export const ReceiptScanInput = ({ disabled }: ReceiptScanInputProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const receiptCtx = useReceiptCtxOptional();

  const parseMutation = api.receipt.parse.useMutation({
    onSuccess: (data) => {
      receiptCtx?.setReceipt(data);
    },
    onError: () => {
      toast.error(t("error.receipt_scan"));
    },
  });

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = "";

    setIsLoading(true);

    try {
      const meta = await uploadFile(file);
      if (!meta) {
        setIsLoading(false);
        return;
      }

      await parseMutation.mutateAsync({
        fileUrl: meta.url,
      });
    } catch {
      toast.error(t("error.receipt_scan"));
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = disabled || isLoading || !receiptCtx;

  return (
    <ListItem
      className={cn(
        "relative text-primary",
        isDisabled && "pointer-events-none text-hint",
      )}
    >
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="absolute inset-0 z-10 cursor-default opacity-0"
        onChange={onFileChange}
        disabled={isDisabled}
      />
      <ListItemLeft size="sm">
        {isLoading ? (
          <Loader2Icon className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <ListItemIcon icon={ScanLineIcon} />
        )}
      </ListItemLeft>
      <ListItemBody size="sm">
        {isLoading ? t("receipt.scanning") : t("receipt.scan")}
      </ListItemBody>
    </ListItem>
  );
};
