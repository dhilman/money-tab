import { Bento } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { Article, type ArticleBlock } from "~/components/pages/blog/article";
import { webAppPage } from "~/components/provider/webapp-provider";
import { AnimatedImage } from "~/components/ui/animated-image";

const blocks: ArticleBlock[] = [
  {
    as: "h1",
    children: `Welcome To MoneyTab!`,
  },
  {
    as: "p",
    children: (
      <>
        MoneyTab is here to help you with shared expenses. With it, you can
        effortlessly track, split, and manage costs. Whether you&apos;re dining
        out with friends, planning a group trip, or sharing household bills with
        roommates.
      </>
    ),
  },
  {
    as: "h2",
    children: `Key Features`,
  },
  {
    as: "custom",
    children: (
      <div className="flex w-full flex-col gap-2 px-4 pb-8" key="features">
        <FeatureCard
          emoji="💸"
          title="Shared Expenses"
          desc="Easily record and split costs for any shared expense."
        />
        <FeatureCard
          emoji="🔄"
          title="Subscription Tracking"
          desc="Keep track of your recurring payments and subscriptions."
        />
        <FeatureCard
          emoji="🧮"
          title="Real-Time Balance"
          desc="Always know who owes what at a glance."
        />
      </div>
    ),
  },
  {
    as: "h2",
    children: "How It Works",
  },
  {
    as: "h3",
    children: `Creating an Expense`,
  },
  {
    as: "ol",
    children: [
      `Tap the "+ Expense" on the home page`,
      `Enter the total amount and description`,
      `Add everyone who shared the expense`,
      `Create the expense - it's that simple!`,
    ].map((text) => <li key={text}>{text}</li>),
  },
  {
    as: "h3",
    children: "Sharing Expenses",
  },
  {
    as: "p",
    children:
      "When your friend is not using MoneyTab yet, you can still create the expense and share the link with them - they will be able to join and you will be notified when they do.",
  },
  {
    as: "h3",
    children: "Tracking Your Balance",
  },
  {
    as: "p",
    children:
      "Your home page displays your current balance across all your contacts and currencies. Green numbers show what others owe you, while red numbers indicate what you owe. Tap on a contact to see your balance with them and a detailed breakdown of your shared expenses.",
  },
  {
    as: "h3",
    children: "Tracking Subscriptions",
  },
  {
    as: "p",
    children:
      "Never forget a payment or miss canceling an unwanted subscription again. With MoneyTab, you can:",
  },
  {
    as: "ol",
    children: [
      "Keep all your subscriptions in one place",
      "Set reminders for upcoming payments",
      "Monitor your total subscription spending",
    ].map((text) => <li key={text}>{text}</li>),
  },
  {
    as: "h2",
    children: `What Our Users Say`,
  },
  {
    as: "custom",
    children: (
      <Testimonials
        key="testimonials"
        items={[
          {
            name: "Alex S.",
            text: `"We’ve never been more organized with our group expenses."`,
          },
          {
            name: "Shane B.",
            text: `"Splitting bills with my roommates is no longer a headache"`,
          },
          {
            name: "Peter T.",
            text: `"MoneyTab has been the easiest way for me to organise my spendings."`,
          },
        ]}
      />
    ),
  },
] as const;

export default webAppPage(Page);
function Page() {
  return (
    <WebAppMain className="space-y-4">
      <Header />
      <Article blocks={blocks} />
    </WebAppMain>
  );
}

const EXAMPLES = [
  { title: "Group Dinners", image: "fork_and_knife" },
  { title: "Travel Expenses", image: "plane" },
  { title: "Groceries", image: "cart" },
  { title: "Tickets", image: "ticket" },
] as const;

function Header() {
  return (
    <Bento>
      <div className="grid w-full grid-cols-2 grid-rows-2 gap-2">
        {EXAMPLES.map((el) => (
          <div
            key={el.title}
            className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-xl border border-hint/10 bg-background"
          >
            <AnimatedImage name={el.image} className="h-28 w-28" />
          </div>
        ))}
      </div>
    </Bento>
  );
}

interface TestimonialProps {
  name: string;
  text: string;
}

function Testimonials({ items }: { items: TestimonialProps[] }) {
  return (
    <div className="not-prose flex w-full items-center gap-2 overflow-y-auto px-4 pb-3">
      {items.map((el, i) => (
        <div
          key={i}
          className="relative flex h-24 w-[85%] shrink-0 flex-col items-center gap-2 rounded-lg border border-hint/10 p-3 shadow-md"
        >
          <div className="text-base">{el.text}</div>
          <div className="absolute bottom-3 right-3 text-sm font-semibold">
            {el.name}
          </div>
        </div>
      ))}
    </div>
  );
}

interface FeatureCardProps {
  emoji: string;
  title: string;
  desc: string;
}

function FeatureCard({ emoji, title, desc }: FeatureCardProps) {
  return (
    <div className="not-prose flex w-full items-center gap-4 px-2 py-3">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-center">
        <span className="text-[2rem]">{emoji}</span>
      </div>
      <div className="w-full space-y-1">
        <div className="text-lg font-semibold">{title}</div>
        <div className="text-sm text-hint">{desc}</div>
      </div>
    </div>
  );
}
