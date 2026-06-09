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
import { useApplyReceiptScan } from "./use-apply-receipt";

/**
 * ListItem row for scanning receipts via camera.
 * Uploads image to S3, calls receipt.parse mutation, then applies the result
 * to the form via useApplyReceiptScan (auto-fills tx fields and switches
 * participants to itemized mode).
 */
export const ReceiptScanInput = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const receiptCtx = useReceiptCtxOptional();
  const applyScan = useApplyReceiptScan();

  const parseMutation = api.receipt.parse.useMutation();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = "";

    // Validate file type (browser accept attribute can be bypassed)
    if (!file.type.startsWith("image/")) {
      toast.error(t("error.receipt_scan"));
      return;
    }

    setIsLoading(true);

    try {
      const meta = await uploadFile(file);
      if (!meta) {
        setIsLoading(false);
        return;
      }

      const result = await parseMutation.mutateAsync({
        fileUrl: meta.url,
      });

      applyScan(result, {
        id: meta.id,
        url: meta.url,
        key: meta.key,
        size: file.size,
        type: file.type,
      });
    } catch {
      toast.error(t("error.receipt_scan"));
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || !receiptCtx;

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
        aria-label={t("receipt.scan")}
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
