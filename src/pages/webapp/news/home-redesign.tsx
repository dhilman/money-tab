import { Bento } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { Article, type ArticleBlock } from "~/components/pages/blog/article";
import { webAppPage } from "~/components/provider/webapp-provider";

const blocks: ArticleBlock[] = [
  {
    as: "h1",
    children: "Homepage Redesign",
  },
  {
    as: "p",
    children: "We're excited to unveil the new MoneyTab homepage! 🎉",
  },
  {
    as: "p",
    children:
      "Managing your shared finances just got easier and more intuitive. Here’s what’s new:",
  },
  {
    as: "ul",
    children: (
      <>
        <li>
          <strong>Refined Summary:</strong> a clear overview of your outstanding
          balance and subscription spending.
        </li>
        <li>
          <strong>Simplified Navigation:</strong> easier access to your recent
          expenses and subscriptions with our new tab-based design.
        </li>
        <li>
          <strong>Streamlined Interface:</strong> cleaner and more organized
          home page with fewer elements and focus on the essentials.
        </li>
      </>
    ),
  },
  {
    as: "p",
    children: "We hope you enjoy the new MoneyTab experience! 💸",
  },
];

export default webAppPage(Page);
function Page() {
  return (
    <WebAppMain className="space-y-4">
      <Header />
      <Article blocks={blocks} />
    </WebAppMain>
  );
}

function Header() {
  return (
    <Bento>
      <img
        src="/poster/home.webp"
        alt="MoneyTab"
        className="aspect-square w-full rounded-2xl"
      />
    </Bento>
  );
}
