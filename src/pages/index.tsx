import { Inter } from "next/font/google";
import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import { TelegramIcon } from "~/components/icon/telegram-icon";
import { env } from "~/env.mjs";
import { cn } from "~/lib/utils";

const inter = Inter({ subsets: ["latin"] });

const BOT_URL = `https://t.me/${env.NEXT_PUBLIC_BOT_USERNAME}`;
const IMG_URL = `${env.NEXT_PUBLIC_BASE_URL}/bento.png`;

const features = [
  {
    title: "Shared Expenses",
    description: "Split bills with friends, family, or groups easily",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
      </svg>
    ),
  },
  {
    title: "Multi-Currency",
    description: "Support for multiple currencies in the same group",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
        <path
          fillRule="evenodd"
          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a3.833 3.833 0 001.719-.756c.712-.566 1.112-1.35 1.112-2.178 0-.829-.4-1.612-1.113-2.178a3.804 3.804 0 00-1.718-.756V8.334c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.808 3.808 0 00-1.719-.755V6z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Subscription Tracking",
    description: "Keep track of your recurring subscriptions",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path
          fillRule="evenodd"
          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-.53 14.03a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V8.25a.75.75 0 00-1.5 0v5.69l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    title: "Blazingly Fast",
    description: "Built for speed and efficiency",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path
          fillRule="evenodd"
          d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

export default function Home() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const style = document.documentElement.style;
    style.setProperty("--background", "0 0% 0%");
    style.setProperty("--canvas", "0 0% 0%");
  }, []);

  return (
    <>
      <Head>
        <title>MoneyTab - Split expenses with friends inside Telegram</title>
        <meta
          name="description"
          content="MoneyTab is a Telegram bot for tracking and splitting expenses with friends, family, and groups"
        />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#000000" />
        <meta name="og:site_name" content="MoneyTab" />
        <meta name="og:image" content={IMG_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={IMG_URL} />
      </Head>

      <main className={`min-h-screen bg-black text-white ${inter.className}`}>
        {/* Header */}
        <header className="container mx-auto flex items-center justify-between px-4 py-6">
          <div className="text-2xl font-bold">MoneyTab</div>
          <Link
            href={BOT_URL}
            className={cn(
              "rounded-full px-4 py-2 text-center text-sm font-semibold text-white",
              "bg-gradient-to-r from-[#229ED9] to-[#2AABEE]"
            )}
          >
            Get Started
          </Link>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto flex flex-col items-center px-4 py-16 lg:flex-row">
          <div className="mb-10 lg:mb-0 lg:w-1/2 lg:pr-16">
            <h1 className="mb-4 text-4xl font-bold md:mb-6 md:text-5xl">
              Split Expenses{" "}
              <span className="text-[#2AABEE]">Effortlessly</span> Inside
              Telegram
            </h1>
            <p className="mb-8 text-lg text-gray-300 md:text-xl">
              Track shared expenses with friends, family, and groups without
              leaving your favorite messenger.
            </p>
            <Link
              href={BOT_URL}
              className={cn(
                "inline-block rounded-full px-8 py-4 text-center text-white",
                "text-xl font-bold",
                "bg-gradient-to-r from-[#229ED9] to-[#2AABEE]",
                "transition-all hover:shadow-lg hover:shadow-blue-500/20"
              )}
            >
              Start Using MoneyTab
            </Link>
          </div>
          <div className="relative lg:w-1/2">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-blue-500/10">
              <img
                src="/poster/home.webp"
                alt="MoneyTab App Screenshot"
                className="mx-auto w-full max-w-md rounded-2xl"
              />
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-10 md:py-16">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Everything You Need For Expense Sharing
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-800 bg-gray-900 p-6 transition-all hover:border-blue-500/50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* App Screenshots */}
        <section className="bg-gradient-to-b from-black to-gray-900 py-10 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Designed For Simplicity
            </h2>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="w-full overflow-hidden rounded-2xl shadow-xl md:w-64">
                <img
                  src="/poster/tour-expenses.webp"
                  alt="Expenses View"
                  className="h-auto w-full"
                />
              </div>
              <div className="w-full overflow-hidden rounded-2xl shadow-xl md:w-64">
                <img
                  src="/poster/tour-expense.webp"
                  alt="Expense Detail"
                  className="h-auto w-full"
                />
              </div>
              <div className="w-full overflow-hidden rounded-2xl shadow-xl md:w-64">
                <img
                  src="/poster/tour-subs.webp"
                  alt="Subscription Tracking"
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-4xl font-bold">
              Ready to simplify expense sharing?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-300">
              Join thousands of users who are already using MoneyTab to track
              expenses with friends and family.
            </p>
            <Link
              href={BOT_URL}
              className={cn(
                "inline-block rounded-full px-10 py-5 text-center text-white",
                "text-xl font-bold",
                "bg-gradient-to-r from-[#229ED9] to-[#2AABEE]",
                "transition-all hover:shadow-xl hover:shadow-blue-500/20"
              )}
            >
              Get Started Now
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto border-t border-gray-800 px-4 py-8">
          <div className="flex flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <div className="mb-2 text-xl font-bold">MoneyTab</div>
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} All rights reserved
              </p>
            </div>
            <div className="flex space-x-6">
              <a href={BOT_URL} className="text-gray-400 hover:text-white">
                <div className="flex h-6 w-6 items-center justify-center">
                  <TelegramIcon className="h-6 w-6" />
                </div>
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
