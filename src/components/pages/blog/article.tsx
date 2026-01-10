import { Bento, BentoContent } from "~/components/bento-box";
import { cn } from "~/lib/utils";

export interface ArticleBlock {
  as: React.ElementType | "custom";
  children: React.ReactNode;
}

interface ArticleProps {
  blocks: ArticleBlock[];
}

export function Article({ blocks }: ArticleProps) {
  return (
    <Bento>
      <BentoContent
        as="article"
        className={cn(
          "prose dark:prose-invert pt-8 pb-4",
          "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
          "prose-headings:mt-[1.25em] prose-h1:mt-[0em] prose-p:mt-0 prose-ol:mt-0 prose-ul:mt-0",
          "prose-headings:mx-4 prose-p:mx-4 prose-blockquote:mx-4 prose-ol:mx-4 prose-ul:mx-4",
        )}
      >
        {blocks.map((block, i) => {
          if (block.as === "custom") {
            return block.children;
          }
          const Component = block.as;
          return <Component key={i} {...block} />;
        })}
      </BentoContent>
    </Bento>
  );
}
