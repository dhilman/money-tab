import { loadMarkdownFile } from "~/lib/file-load";

interface Props {
  content: string;
}

export default Page;
function Page({ content }: Props) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 md:max-w-2xl">
      <div
        className="prose prose-lg dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}

export async function getStaticProps() {
  const content = await loadMarkdownFile("public/privacy.md");

  return {
    props: {
      content,
    },
  };
}
