import i18n from "~/lib/i18n";

export function formatListItems(items: string[]): string {
  const last = items.pop();
  if (!last) return "";
  if (items.length === 0) return last;
  if (items.length === 1) return `${items[0] || ""} ${i18n.t("and")} ${last}`;
  return `${items.join(", ")} ${i18n.t("and")} ${last}`;
}
