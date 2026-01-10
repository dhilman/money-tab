import { ImageIcon, Loader2Icon, XIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Bento } from "~/components/bento-box";
import {
  ListItem,
  ListItemBody,
  ListItemIcon,
  ListItemLeft,
} from "~/components/ui/list-item";
import { uploadFile } from "~/lib/file-upload";
import { cn } from "~/lib/utils";

export interface Attachment {
  id: string;
  url: string;
  key: string;
  size: number;
  type: string;
  uploading?: boolean;
}

interface FileInputProps {
  onUploadStart: (id: string) => void;
  onUploadFail: (id: string) => void;
  onUploadSuccess: (id: string, v: Attachment) => void;
  disabled?: boolean;
}

export const FileInput = ({
  onUploadStart,
  onUploadFail,
  onUploadSuccess,
  disabled,
}: FileInputProps) => {
  const { t } = useTranslation();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempId = Math.random().toString(36).slice(2);
    onUploadStart(tempId);

    uploadFile(file)
      .then((meta) => {
        if (!meta) {
          onUploadFail(tempId);
          return;
        }
        onUploadSuccess(tempId, {
          id: meta.id,
          uploading: false,
          url: meta.url,
          key: meta.key,
          size: file.size,
          type: file.type,
        });
      })
      .catch(() => {
        toast.error(t("error.attachment_upload"));
        onUploadFail(tempId);
      });
  };

  return (
    <ListItem className={cn("text-primary relative", disabled && "text-hint")}>
      <input
        type="file"
        className="absolute inset-0 z-10 cursor-default opacity-0"
        onChange={onFileChange}
        disabled={disabled}
      />
      <ListItemLeft size="sm">
        <ListItemIcon icon={ImageIcon} />
      </ListItemLeft>
      <ListItemBody size="sm">{t("add_attachement")}</ListItemBody>
    </ListItem>
  );
};

interface FilePreviewListProps {
  files: Attachment[];
  onRemove: (id: string) => void;
}

export const FilePreviewList = ({ files, onRemove }: FilePreviewListProps) => {
  if (files.length === 0) return null;

  return (
    <Bento>
      <div className="flex w-full flex-row flex-wrap items-center gap-3">
        {files.map((file) => (
          <FilePreviewProps
            key={file.id}
            file={file}
            onRemove={() => onRemove(file.id)}
          />
        ))}
      </div>
    </Bento>
  );
};

interface FilePreviewProps {
  file: Attachment;
  onRemove: () => void;
}

const FilePreviewProps = ({ file, onRemove }: FilePreviewProps) => {
  if (file.uploading) {
    return (
      <div className="border-hint/20 bg-background/40 flex h-16 w-16 items-center justify-center rounded-md border-[0.5px]">
        <Loader2Icon className="text-primary h-8 w-8 animate-spin stroke-1 duration-1000" />
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src={file.url}
        className="border-hint/20 h-16 w-16 rounded-md border-[0.5px] object-cover"
        alt="Uploaded file"
      />
      <button
        className={cn(
          "absolute top-0 right-0 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red-500",
          "translate-x-1/2 -translate-y-1/2",
        )}
        onClick={onRemove}
      >
        <XIcon className="h-4 w-4 text-white" />
      </button>
    </div>
  );
};
