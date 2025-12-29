import toast from "react-hot-toast";
import i18n from "~/lib/i18n";
import { createTgRequestHeaders } from "~/lib/tg-web-app-data";

interface UploadUrlResp {
  uploadUrl: string;
  url: string;
  key: string;
  id: string;
}

async function getUploadUrl(params: { type: string }) {
  const resp = await fetch("/api/s3-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...createTgRequestHeaders(),
    },
    body: JSON.stringify(params),
  });
  return (await resp.json()) as UploadUrlResp;
}

// 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function uploadFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    toast.error(i18n.t("error.attachment_too_large"));
    return;
  }

  const meta = await getUploadUrl({ type: file.type });

  await fetch(meta.uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  return meta;
}
