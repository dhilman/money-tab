import fs from "fs";
import { remark } from "remark";
import html from "remark-html";

export async function loadMarkdownFile(path: string): Promise<string> {
  const content = fs.readFileSync(path, "utf8");

  const result = await remark().use(html).process(content);

  return result.toString();
}
