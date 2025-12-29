import toast from "react-hot-toast";
import i18n from "~/lib/i18n";

function shouldUseShareSheet() {
  if (typeof window === "undefined") return false;
  const platform = (window?.Telegram?.WebApp?.platform ?? "").toLowerCase();
  return platform === "ios" || platform === "android";
}

export async function copyToClipboard(
  data: {
    title: string;
    url: string;
  },
  opts?: {
    useShareSheet?: boolean;
    success?: string;
    error?: string | null;
  }
) {
  const successMsg = opts?.success ?? i18n.t("common:copied");
  const errorMsg =
    opts?.error !== undefined ? opts.error : i18n.t("common:failed_to_copy");

  if (typeof navigator === "undefined") return false;
  if (opts?.useShareSheet && shouldUseShareSheet()) {
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      return false;
    }
  }

  if (!navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(data.url);
    toast.success(successMsg);
    return true;
  } catch (err) {
    errorMsg && toast.error(errorMsg);
    return false;
  }
}
